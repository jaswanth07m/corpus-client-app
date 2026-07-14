// src/pages/tools/ImageAnnotation.tsx
//
// MVP Image Annotation tool page. Frontend-only prototype: no backend calls,
// no queue, no auth handling here (this page is expected to be wrapped in
// <RequireAuth> when registered in App.tsx, matching every other /tools/*
// route). All annotation data lives in local React state and is rendered as
// JSON at the bottom of the page so it can be inspected/copied while the
// backend contract is still being defined.
//
// Not implemented by design (per MVP scope): polygons/segmentation, AI
// assistance, persistence, record queue integration.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  ImagePlus,
  MousePointer2,
  Square,
  Trash2,
  Eraser,
  Upload,
} from 'lucide-react';
import { AnnotationCanvas } from '../components/annotation/AnnotationCanvas';
import type { AnnotationShape, AnnotationTool } from '../types/annotation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const DEFAULT_IMAGE_URL =
  'https://placehold.co/1024x683/e6f1fb/0c447c?text=Upload+an+image+to+annotate';

export function ImageAnnotationPage() {
  const [imageUrl, setImageUrl] = useState<string>(DEFAULT_IMAGE_URL);
  const [hasImage, setHasImage] = useState(false);
  const [shapes, setShapes] = useState<AnnotationShape[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<AnnotationTool>('rectangle');
  const [labelInput, setLabelInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset the input's value regardless of outcome so choosing the exact
      // same file again still fires a change event (browsers otherwise treat
      // an unchanged input value as a no-op and skip onChange entirely).
      event.target.value = '';
      if (!file) return;

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const nextUrl = URL.createObjectURL(file);
      objectUrlRef.current = nextUrl;

      setImageUrl(nextUrl);
      setHasImage(true);
      setShapes([]);
      setSelectedShapeId(null);
    },
    [],
  );

  // Object URLs are only revoked when a *new* file replaces the current one
  // (see handleFileChange above) — this covers the remaining case where the
  // component unmounts while a blob URL is still the active image.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const handleShapeCommitted = useCallback((shape: AnnotationShape) => {
    setShapes((prev) => [...prev, shape]);
    // Newly drawn boxes are selected immediately so they can be relabeled,
    // resized, or deleted right away without an extra click.
    setSelectedShapeId(shape.id);
  }, []);

  const handleShapeUpdated = useCallback((updated: AnnotationShape) => {
    setShapes((prev) =>
      prev.map((shape) => (shape.id === updated.id ? updated : shape)),
    );
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedShapeId) return;
    setShapes((prev) => prev.filter((shape) => shape.id !== selectedShapeId));
    setSelectedShapeId(null);
  }, [selectedShapeId]);

  const handleClearAll = useCallback(() => {
    setShapes([]);
    setSelectedShapeId(null);
  }, []);

  const handleLabelInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setLabelInput(value);

      if (selectedShapeId) {
        setShapes((prev) =>
          prev.map((shape) =>
            shape.id === selectedShapeId
              ? { ...shape, label: value || null }
              : shape,
          ),
        );
      }
    },
    [selectedShapeId],
  );

  const handleSelectShape = useCallback(
    (id: string | null) => {
      setSelectedShapeId(id);
      const shape = shapes.find((s) => s.id === id);
      setLabelInput(shape?.label ?? '');
    },
    [shapes],
  );

  // Delete/Backspace removes the selected box, unless the user is typing in
  // a text field (e.g. the label input), where Backspace should edit text.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      const target = event.target as HTMLElement | null;
      const isTyping =
        target != null &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (isTyping || !selectedShapeId) return;
      event.preventDefault();
      handleDeleteSelected();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedShapeId, handleDeleteSelected]);

  const selectedShape =
    shapes.find((shape) => shape.id === selectedShapeId) ?? null;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Image annotation
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(
            'common.drawBoundingBoxesOnAnImageAndOptionallyLabelThemThisIsALocalPrototypeNothingIsSavedToTheServerYet',
          )}
        </p>
      </header>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {!hasImage ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-medium">
                {t('common.noImageLoadedYet')}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t(
                  'common.uploadAnImageToStartDrawingBoundingBoxesNothingIsSentAnywhereThisStaysOnYourDeviceUntilTheAnnotationBackendIsConnected',
                )}
              </p>
            </div>
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload image
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                {/* Tool group */}
                <div className="flex items-center gap-1 rounded-md bg-muted p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTool === 'rectangle' ? 'default' : 'ghost'}
                    aria-pressed={activeTool === 'rectangle'}
                    onClick={() => setActiveTool('rectangle')}
                  >
                    <Square className="h-4 w-4" />
                    {t('common.draw.box')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={activeTool === 'select' ? 'default' : 'ghost'}
                    aria-pressed={activeTool === 'select'}
                    onClick={() => setActiveTool('select')}
                  >
                    <MousePointer2 className="h-4 w-4" />
                    {t('common.selectMove')}
                  </Button>
                </div>

                <Separator
                  orientation="vertical"
                  className="hidden h-6 sm:block"
                />

                {/* Shape actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    disabled={!selectedShapeId}
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('common.deleteSelected')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={shapes.length === 0}
                    onClick={handleClearAll}
                  >
                    <Eraser className="h-4 w-4" />
                    {t('common.clearAll')}
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t('common.uploadImage')}
              </Button>
            </CardContent>
          </Card>

          {/* Label input */}
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <label
              htmlFor="shape-label"
              className="text-sm font-medium text-foreground shrink-0"
            >
              {t('categories.labelFor')}
              {selectedShape ? 'selected box' : 'next box'}
            </label>
            <Input
              id="shape-label"
              type="text"
              value={labelInput}
              onChange={handleLabelInputChange}
              placeholder={t('common.eg.person.car.sign')}
              className="w-full sm:w-64"
            />
          </div>

          {/* Canvas */}
          <Card className="overflow-hidden">
            <CardContent className="bg-muted/40 p-2 sm:p-4">
              <AnnotationCanvas
                imageUrl={imageUrl}
                shapes={shapes}
                activeTool={activeTool}
                activeLabel={labelInput || null}
                selectedShapeId={selectedShapeId}
                onShapeCommitted={handleShapeCommitted}
                onShapeUpdated={handleShapeUpdated}
                onSelectShape={handleSelectShape}
              />
            </CardContent>
          </Card>

          {/* JSON viewer */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
              <CardTitle className="text-sm font-medium">
                {t('common.annotationData')}
              </CardTitle>
              <Badge variant="secondary">
                {shapes.length} {shapes.length === 1 ? 'box' : 'boxes'}
              </Badge>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                <pre className="p-4 font-mono text-xs leading-relaxed text-foreground">
                  {shapes.length > 0 ? JSON.stringify(shapes, null, 2) : '[]'}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ImageAnnotationPage;
