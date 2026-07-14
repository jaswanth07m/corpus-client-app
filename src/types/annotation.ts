// src/types/annotation.ts
//
// Type definitions for the Image Annotation MVP.
// Bounding boxes only — no polygon/segmentation shapes.
// Coordinates are normalized (0-1) relative to the natural image size, so
// annotations remain valid regardless of what size the canvas is rendered at.

export type AnnotationTool = 'select' | 'rectangle';

/** Placeholder author identifier, used until the backend/auth contract for
 *  attributing annotations to a real user is defined (see architecture doc
 *  §11 — this is expected to become the authenticated user's id/username). */
export const UNKNOWN_ANNOTATOR = 'unknown';

/** Confidence assigned to a manually drawn box — always 1.0 until this MVP
 *  gains any model-assisted/AI suggestion path, which is explicitly out of
 *  scope for now. */
export const DEFAULT_ANNOTATION_CONFIDENCE = 1.0;

export interface AnnotationShape {
  id: string;
  /** Optional free-text label attached to the box (e.g. "dog", "license plate"). */
  label: string | null;
  /** Normalized 0-1, left edge relative to image width. */
  x: number;
  /** Normalized 0-1, top edge relative to image height. */
  y: number;
  /** Normalized 0-1, relative to image width. */
  width: number;
  /** Normalized 0-1, relative to image height. */
  height: number;
  /** ISO 8601 timestamp of when this box was first drawn. */
  createdAt: string;
  /** ISO 8601 timestamp of the most recent edit (move, resize, relabel). */
  updatedAt: string;
  /** Placeholder identifier for who created the box. Defaults to
   *  UNKNOWN_ANNOTATOR until this is wired to a real authenticated user. */
  createdBy: string;
  /** 0-1 confidence in this annotation. Manually drawn boxes default to
   *  DEFAULT_ANNOTATION_CONFIDENCE; reserved for future model-assisted
   *  annotation, where a suggested box could carry a lower value. */
  confidence: number;
}

/** Fields a caller must supply when creating a new shape; everything else
 *  (timestamps, attribution, confidence) is filled in with sensible MVP
 *  defaults by createAnnotationShape. */
export type NewAnnotationShapeInput = Pick<
  AnnotationShape,
  'id' | 'label' | 'x' | 'y' | 'width' | 'height'
>;

/** Builds a fully-populated AnnotationShape from just its geometry, so every
 *  call site that commits a newly drawn box produces consistent metadata
 *  instead of each caller inlining its own createdAt/createdBy/confidence. */
export function createAnnotationShape(
  input: NewAnnotationShapeInput,
): AnnotationShape {
  const now = new Date().toISOString();
  return {
    ...input,
    createdAt: now,
    updatedAt: now,
    createdBy: UNKNOWN_ANNOTATOR,
    confidence: DEFAULT_ANNOTATION_CONFIDENCE,
  };
}

/** Returns a copy of the shape with updatedAt bumped to now — intended for
 *  any move/resize/relabel mutation so updatedAt stays accurate without
 *  every call site remembering to set it by hand. */
export function touchAnnotationShape(shape: AnnotationShape): AnnotationShape {
  return { ...shape, updatedAt: new Date().toISOString() };
}
