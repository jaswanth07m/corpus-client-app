// src/components/annotation/AnnotationCanvas.tsx
//
// The only component that imports react-konva/konva. Renders an image with
// draggable/resizable rectangular bounding boxes drawn on top of it, plus
// mouse-wheel zoom, hold-Space-to-pan, and a fit-to-screen control.
// Fully controlled: the parent owns the shape array and passes it in, this
// component only emits events (commit / update / select) for the parent to
// apply. Coordinates are normalized (0-1) — see src/types/annotation.ts.
//
// Zoom/pan are implemented entirely as Stage-level transforms (scale + x/y).
// Because shape geometry lives on Layer children, which are unaffected by
// their parent Stage's own scale/position, none of the normalized-coordinate
// conversion logic (toStagePx/fromStagePx) needs to change — only the raw
// pointer-position lookup switches from getPointerPosition() (screen space)
// to getRelativePointerPosition() (content space, i.e. inverse of the
// Stage's own transform), which is what keeps drawing/selecting correct at
// any zoom level or pan offset.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Transformer,
  Text,
} from 'react-konva';
import { Maximize2 } from 'lucide-react';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { AnnotationShape, AnnotationTool } from '../../types/annotation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createAnnotationShape } from '../../types/annotation';
import { touchAnnotationShape } from '../../types/annotation';

export interface AnnotationCanvasProps {
  imageUrl: string;
  shapes: AnnotationShape[];
  activeTool: AnnotationTool;
  activeLabel: string | null;
  selectedShapeId: string | null;
  /** Called once when a new rectangle drawn by the user is finished (pointer-up). */
  onShapeCommitted: (shape: AnnotationShape) => void;
  /** Called when an existing shape is moved or resized. */
  onShapeUpdated: (shape: AnnotationShape) => void;
  /** Called when the user clicks a shape, or clicks empty canvas (id = null). */
  onSelectShape: (id: string | null) => void;
  /** Max canvas height in px. The width is fully responsive to its container. */
  maxHeight?: number;
}

const MIN_BOX_SIZE_PX = 4;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.05;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function AnnotationCanvas({
  imageUrl,
  shapes,
  activeTool,
  activeLabel,
  selectedShapeId,
  onShapeCommitted,
  onShapeUpdated,
  onSelectShape,
  maxHeight = 520,
}: AnnotationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const selectedRectRef = useRef<Konva.Rect>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // In-progress rectangle being drawn, tracked in stage-content coordinates.
  const [draftBox, setDraftBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

  // Zoom/pan transform applied to the Stage itself. Content coordinates
  // (shape geometry) are never expressed in terms of this — it's purely a
  // viewport transform, so normalized shape data stays untouched by it.
  const [zoomScale, setZoomScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanningStage, setIsPanningStage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      // A newly loaded image should always start fit-to-screen rather than
      // inheriting whatever zoom/pan was left over from a previous image.
      setZoomScale(1);
      setStagePos({ x: 0, y: 0 });
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Hold Space to temporarily switch to pan mode, regardless of activeTool —
  // matches the convention used by most drawing/annotation tools. Excludes
  // form controls (text entry) AND buttons/role="button" elements, since
  // those natively activate on Space — intercepting it there would silently
  // break keyboard activation of every toolbar button.
  useEffect(() => {
    const isInteractiveControl = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const interactiveTags = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
      return (
        interactiveTags.includes(target.tagName) ||
        target.isContentEditable ||
        target.getAttribute('role') === 'button'
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      if (isInteractiveControl(event.target)) return;
      event.preventDefault();
      setIsSpacePressed(true);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      setIsSpacePressed(false);
      setIsPanningStage(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Escape cancels an in-progress box draw without committing it.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      drawStartRef.current = null;
      setDraftBox(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scale =
    image && containerWidth
      ? Math.min(containerWidth / image.width, maxHeight / image.height)
      : 1;
  const displayWidth = image ? image.width * scale : containerWidth;
  const displayHeight = image ? image.height * scale : maxHeight;

  const toStagePx = useCallback(
    (shape: AnnotationShape) => ({
      x: shape.x * displayWidth,
      y: shape.y * displayHeight,
      width: shape.width * displayWidth,
      height: shape.height * displayHeight,
    }),
    [displayWidth, displayHeight],
  );

  const fromStagePx = useCallback(
    (x: number, y: number, w: number, h: number) => ({
      x: clamp01(x / displayWidth),
      y: clamp01(y / displayHeight),
      width: clamp01(w / displayWidth),
      height: clamp01(h / displayHeight),
    }),
    [displayWidth, displayHeight],
  );

  // Keeps drawing coordinates within the image bounds — prevents boxes from
  // being started or dragged past the edge of the rendered image. Bounds are
  // in content space, so they stay correct at any zoom level.
  const clampToImageBounds = useCallback(
    (x: number, y: number) => ({
      x: Math.min(Math.max(x, 0), displayWidth),
      y: Math.min(Math.max(y, 0), displayHeight),
    }),
    [displayWidth, displayHeight],
  );

  useEffect(() => {
    if (!transformerRef.current) return;
    if (selectedRectRef.current && activeTool === 'select') {
      transformerRef.current.nodes([selectedRectRef.current]);
    } else {
      transformerRef.current.nodes([]);
    }
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedShapeId, activeTool, shapes]);

  const handleStageMouseDown = (
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (isSpacePressed) return; // Stage's own draggable handles panning.
    if (activeTool !== 'rectangle') {
      if (e.target === e.target.getStage()) onSelectShape(null);
      return;
    }
    // Guards against the brief window before ResizeObserver reports a real
    // width — drawing here would divide by zero in fromStagePx and store
    // NaN coordinates.
    if (displayWidth <= 0 || displayHeight <= 0) return;
    const stage = e.target.getStage();
    const pointer = stage?.getRelativePointerPosition();
    if (!pointer) return;
    const pos = clampToImageBounds(pointer.x, pointer.y);
    drawStartRef.current = { x: pos.x, y: pos.y };
    setDraftBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleStageMouseMove = (
    e: KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (isSpacePressed) return;
    if (activeTool !== 'rectangle' || !drawStartRef.current) return;
    const stage = e.target.getStage();
    const pointer = stage?.getRelativePointerPosition();
    if (!pointer) return;
    const pos = clampToImageBounds(pointer.x, pointer.y);
    const start = drawStartRef.current;
    setDraftBox({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      w: Math.abs(pos.x - start.x),
      h: Math.abs(pos.y - start.y),
    });
  };

  const handleStageMouseUp = () => {
    if (isSpacePressed) return;
    if (activeTool !== 'rectangle' || !draftBox) {
      drawStartRef.current = null;
      setDraftBox(null);
      return;
    }
    if (draftBox.w >= MIN_BOX_SIZE_PX && draftBox.h >= MIN_BOX_SIZE_PX) {
      const normalized = fromStagePx(
        draftBox.x,
        draftBox.y,
        draftBox.w,
        draftBox.h,
      );
      onShapeCommitted(
        createAnnotationShape({
          id: crypto.randomUUID(),
          label: activeLabel,
          ...normalized,
        }),
      );
    }
    drawStartRef.current = null;
    setDraftBox(null);
  };

  const handleShapeDragEnd = (
    shape: AnnotationShape,
    e: KonvaEventObject<DragEvent>,
  ) => {
    const node = e.target;
    const normalized = fromStagePx(
      node.x(),
      node.y(),
      node.width(),
      node.height(),
    );
    onShapeUpdated(
      touchAnnotationShape({
        ...shape,
        ...normalized,
      }),
    );
  };

  const handleShapeTransformEnd = (
    shape: AnnotationShape,
    e: KonvaEventObject<Event>,
  ) => {
    const node = e.target as Konva.Rect;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const width = node.width() * scaleX;
    const height = node.height() * scaleY;
    node.scaleX(1);
    node.scaleY(1);
    const normalized = fromStagePx(node.x(), node.y(), width, height);
    onShapeUpdated({ ...shape, ...normalized });
  };

  // Zooms toward the pointer position, standard Konva wheel-zoom recipe.
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const oldScale = zoomScale;
    const pointerContentPos = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const rawScale =
      direction > 0 ? oldScale * ZOOM_STEP : oldScale / ZOOM_STEP;
    const newScale = clampZoom(rawScale);

    setZoomScale(newScale);
    setStagePos({
      x: pointer.x - pointerContentPos.x * newScale,
      y: pointer.y - pointerContentPos.y * newScale,
    });
  };

  const handleFitToScreen = useCallback(() => {
    setZoomScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const cursorStyle = isSpacePressed
    ? isPanningStage
      ? 'grabbing'
      : 'grab'
    : activeTool === 'rectangle'
      ? 'crosshair'
      : 'default';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md border bg-background/90 px-2 py-1 shadow-sm backdrop-blur">
        <Badge variant="secondary" className="tabular-nums select-none">
          {Math.round(zoomScale * 100)}%
        </Badge>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title={t('media.fitImageToScreen')}
          aria-label="Fit image to screen"
          onClick={handleFitToScreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={containerRef}
        role="group"
        aria-label={`Image annotation canvas, ${shapes.length} bounding box${
          shapes.length === 1 ? '' : 'es'
        } drawn`}
        style={{ width: '100%', cursor: cursorStyle }}
      >
        <Stage
          width={displayWidth || 1}
          height={displayHeight || maxHeight}
          scaleX={zoomScale}
          scaleY={zoomScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={isSpacePressed}
          onDragStart={() => setIsPanningStage(true)}
          onDragEnd={(e) => {
            setIsPanningStage(false);
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onTouchStart={handleStageMouseDown}
          onTouchMove={handleStageMouseMove}
          onTouchEnd={handleStageMouseUp}
        >
          <Layer listening={false}>
            {image && (
              <KonvaImage
                image={image}
                width={displayWidth}
                height={displayHeight}
              />
            )}
          </Layer>

          <Layer>
            {shapes.map((shape) => {
              const px = toStagePx(shape);
              const isSelected = shape.id === selectedShapeId;
              return (
                <ShapeGroup
                  key={shape.id}
                  shape={shape}
                  px={px}
                  isSelected={isSelected}
                  draggable={activeTool === 'select' && !isSpacePressed}
                  shapeRef={isSelected ? selectedRectRef : undefined}
                  onClick={() =>
                    activeTool === 'select' &&
                    !isSpacePressed &&
                    onSelectShape(shape.id)
                  }
                  onDragEnd={(e) => handleShapeDragEnd(shape, e)}
                  onTransformEnd={(e) => handleShapeTransformEnd(shape, e)}
                />
              );
            })}

            {draftBox && (
              <Rect
                x={draftBox.x}
                y={draftBox.y}
                width={draftBox.w}
                height={draftBox.h}
                stroke="#378ADD"
                strokeWidth={2 / zoomScale}
                dash={[6 / zoomScale, 4 / zoomScale]}
                fill="rgba(55, 138, 221, 0.1)"
                listening={false}
              />
            )}

            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              flipEnabled={false}
              boundBoxFunc={(oldBox, newBox) =>
                newBox.width < MIN_BOX_SIZE_PX ||
                newBox.height < MIN_BOX_SIZE_PX
                  ? oldBox
                  : newBox
              }
            />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}

interface ShapeGroupProps {
  shape: AnnotationShape;
  px: { x: number; y: number; width: number; height: number };
  isSelected: boolean;
  draggable: boolean;
  shapeRef?: RefObject<Konva.Rect>;
  onClick: () => void;
  onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: KonvaEventObject<Event>) => void;
}

function ShapeGroup({
  shape,
  px,
  isSelected,
  draggable,
  shapeRef,
  onClick,
  onDragEnd,
  onTransformEnd,
}: ShapeGroupProps) {
  return (
    <>
      <Rect
        ref={shapeRef}
        x={px.x}
        y={px.y}
        width={px.width}
        height={px.height}
        stroke={isSelected ? '#D85A30' : '#378ADD'}
        strokeWidth={isSelected ? 3 : 2}
        fill={
          isSelected ? 'rgba(216, 90, 48, 0.08)' : 'rgba(55, 138, 221, 0.06)'
        }
        draggable={draggable}
        onClick={onClick}
        onTap={onClick}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
      />
      {shape.label && (
        <Text
          x={px.x}
          y={Math.max(0, px.y - 16)}
          text={shape.label}
          fontSize={12}
          fill={isSelected ? '#D85A30' : '#378ADD'}
          listening={false}
        />
      )}
    </>
  );
}

export default AnnotationCanvas;
