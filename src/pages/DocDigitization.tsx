import { SuggestionBar } from '@/components/SuggestionBar';
import { AutoResizeTextArea } from '@/components/AutoResizeTextArea';
import { useTeluguTyping } from '@/hooks/useTeluguTyping';
import { transliterate } from '@/lib/teluguKeyboard';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCw,
  SkipForward,
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { BACKEND_URL, IS_DOC_DIGITIZATION_VALIDATION } from '@/lib/constants';
import { toast } from 'sonner';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Type definitions for segment-based OCR
export type Segment = {
  start: number;
  end: number;
  text: string;
  confidence?: number;
  proofread?: boolean;
  validated?: boolean;
  skipped?: boolean;
  skip_reason?: string;
  edit?: string[];
  bbox?: number[];
  type?: string;
  reading_order?: number;
  originalIndex?: number;
  extraction_metadata?: Record<string, unknown>;
  named_entities?: Record<string, unknown>;
};

export type DraftState = {
  recordId: string;
  pageNumber: number;
  segmentsByPageEntries: [number, Segment[]][];
  flippedViewedOriginalIndicesArray: number[];
};

export function saveDraft(state: DraftState): void {
  try {
    localStorage.setItem(
      `doc-digitization-draft-${state.recordId}`,
      JSON.stringify(state),
    );
  } catch {
    /* quota exceeded — silently ignore */
  }
}

export function clearDraft(recordId: string): void {
  localStorage.removeItem(`doc-digitization-draft-${recordId}`);
}

export function findAnyDraft(): DraftState | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('doc-digitization-draft-')) {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as DraftState;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function hasSavedOrSkippedPages(
  segmentsByPage: Map<number, Segment[]>,
): boolean {
  for (const segs of segmentsByPage.values()) {
    if (segs.some((s) => s.proofread || s.skipped)) return true;
  }
  return false;
}

function isSegmentComplete(seg: Segment): boolean {
  const meta = seg.extraction_metadata || {};
  const entities = seg.named_entities || {};

  if (!meta.genre || String(meta.genre).trim() === '') return false;
  if (!meta.moral || String(meta.moral).trim() === '') return false;
  if (!meta.title || String(meta.title).trim() === '') return false;
  if (!meta.author || String(meta.author).trim() === '') return false;

  const locs = entities.locations;
  if (!locs) return false;
  if (typeof locs === 'string' && locs.trim() === '') return false;
  if (Array.isArray(locs) && locs.length === 0) return false;
  if (typeof locs === 'object' && !Array.isArray(locs) && locs !== null) {
    const locEntries = Object.entries(locs as Record<string, unknown>);
    const hasValidLoc = locEntries.some(
      ([k]) => k.trim() !== '' && !k.startsWith('__new_'),
    );
    if (!hasValidLoc) return false;
  }

  const chars = entities.characters as Record<string, unknown> | undefined;
  if (!chars) return false;
  const charEntries = Object.entries(chars);
  const hasValidChar = charEntries.some(([k, v]) => {
    if (k.startsWith('__new_')) return false;
    return k.trim().length > 0 && String(v ?? '').trim().length > 0;
  });
  if (!hasValidChar) return false;

  return true;
}

type ExtractedTextResponse = {
  transcription?: string;
  confidence?: number;
  language?: string;
  extraction_type?: string;
  quality_score?: number;
  notes?: string;
  segments?: Segment[];
  summary?: string;
  named_entities?: Record<string, unknown>[];
  model_name?: string;
  processing_date?: string;
  metadata?: Record<string, unknown>;
};

type RecordDetails = {
  title?: string;
  language?: string;
  author?: string;
  source?: string;
  category?: string;
  category_ids?: string[];
  skip?: boolean;
  skip_reason?: string;
  extracted_text?: ExtractedTextResponse;
};

type BookData = {
  pdfUrl: string;
  metadata: {
    title?: string;
    language?: string;
    author?: string;
    source?: string;
  };
};

type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
  normalized: boolean;
};

function normalizeBbox(input: number[] | undefined): NormalizedBox | null {
  if (!input || input.length < 4) return null;

  const [a, b, c, d] = input.map(Number);
  if ([a, b, c, d].some((value) => Number.isNaN(value))) return null;

  const x = Math.min(a, c);
  const y = Math.min(b, d);
  const width = Math.abs(c - a);
  const height = Math.abs(d - b);

  const maxValue = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));

  return { x, y, width, height, normalized: maxValue <= 1.01 };
}

function buildOverlayStyle(
  box: NormalizedBox | null,
  pageWidth: number,
  pageHeight: number,
): React.CSSProperties | null {
  if (!box || pageWidth === 0 || pageHeight === 0) return null;

  // If coordinates are normalized (0-1 range)
  if (box.normalized) {
    return {
      left: `${box.x * 100}%`,
      top: `${box.y * 100}%`,
      width: `${box.width * 100}%`,
      height: `${box.height * 100}%`,
    };
  }

  // Otherwise assume pixel coordinates relative to page size
  return {
    left: `${(box.x / pageWidth) * 100}%`,
    top: `${(box.y / pageHeight) * 100}%`,
    width: `${(box.width / pageWidth) * 100}%`,
    height: `${(box.height / pageHeight) * 100}%`,
  };
}

function getBboxColorClasses(type?: string) {
  const t = type?.toLowerCase() || '';

  // Green: image, table, equation
  if (t === 'image' || t === 'table' || t === 'equation') {
    return {
      box: 'border-green-400 bg-green-300/25 hover:bg-green-300/40',
      label: 'bg-green-500',
    };
  }

  // Blue: image_caption, header, footer, page_footnote
  if (
    t === 'image_caption' ||
    t === 'header' ||
    t === 'footer' ||
    t === 'page_footnote'
  ) {
    return {
      box: 'border-blue-400 bg-blue-300/25 hover:bg-blue-300/40',
      label: 'bg-blue-500',
    };
  }

  // Pink: title, text, list (and others)
  return {
    box: 'border-pink-400 bg-pink-300/25 hover:bg-pink-300/40',
    label: 'bg-pink-500',
  };
}

// Infer the original image dimensions from the bbox coordinate extents.
// OCR bbox coordinates are in the pixel space of the source images (e.g. 300 DPI),
// which is much larger than the PDF page dimensions in points (72 DPI).
// We find the maximum coordinate values across all segments on a page
// to approximate the source image dimensions.
function getOcrReferenceDimensions(
  segments: Segment[],
): { width: number; height: number } | null {
  let maxX = 0;
  let maxY = 0;
  let hasPixelCoords = false;

  for (const seg of segments) {
    if (seg.bbox && seg.bbox.length >= 4) {
      const [a, b, c, d] = seg.bbox.map(Number);
      if ([a, b, c, d].some((v) => Number.isNaN(v))) continue;

      const maxVal = Math.max(
        Math.abs(a),
        Math.abs(b),
        Math.abs(c),
        Math.abs(d),
      );
      if (maxVal > 1.01) {
        hasPixelCoords = true;
      }
      maxX = Math.max(maxX, Math.abs(a), Math.abs(c));
      maxY = Math.max(maxY, Math.abs(b), Math.abs(d));
    }
  }

  if (!hasPixelCoords || maxX === 0 || maxY === 0) return null;

  // Many modern OCR systems normalize coordinates to a 1000x1000 grid.
  // If the bounds don't exceed 1000, we should use exactly 1000 rather than
  // the maximum observed coordinate, which would stretch the boxes.
  if (maxX <= 1000 && maxY <= 1000) {
    return { width: 1000, height: 1000 };
  }

  return { width: maxX, height: maxY };
}

// Group segments by page (start/end values)
function groupSegmentsByPage(segments: Segment[]): Map<number, Segment[]> {
  const pageMap = new Map<number, Segment[]>();

  segments.forEach((segment, index) => {
    const segmentWithIndex = { ...segment, originalIndex: index };

    const startPage = segment.start + 1;
    const endPage = segment.end;

    if (segment.end - segment.start > 1) {
      for (let p = startPage; p <= endPage; p++) {
        if (!pageMap.has(p)) pageMap.set(p, []);
        pageMap.get(p)!.push(segmentWithIndex);
      }
    } else {
      if (!pageMap.has(startPage)) pageMap.set(startPage, []);
      pageMap.get(startPage)!.push(segmentWithIndex);
    }
  });

  pageMap.forEach((pageSegments) => {
    pageSegments.sort((a, b) => {
      if (a.reading_order !== undefined && b.reading_order !== undefined) {
        return a.reading_order - b.reading_order;
      }
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });
  });

  return pageMap;
}

function DocDigitization() {
  const { t } = useTranslation();
  const fallbackFilters = useMemo(
    () => ({ media_type: ['document'], is_fully_proofread: true }),
    [],
  );
  // const { reviewFilters, isReady: areReviewFiltersReady } =
  //   useToolEventFilters(fallbackFilters);
  const reviewFilters = fallbackFilters;
  const areReviewFiltersReady = true;
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [fullRecordData, setFullRecordData] = useState<RecordDetails | null>(
    null,
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [segmentsByPage, setSegmentsByPage] = useState<Map<number, Segment[]>>(
    new Map(),
  );

  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRecordId, setSearchRecordId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [pdfContainerRef, setPdfContainerRef] = useState<HTMLDivElement | null>(
    null,
  );
  const [pdfPageSize, setPdfPageSize] = useState({ width: 0, height: 0 });
  const [showBboxes, setShowBboxes] = useState(true);
  const [highlightedSegmentIndex, setHighlightedSegmentIndex] = useState<
    number | null
  >(null);
  const [editingSegmentIndex, setEditingSegmentIndex] = useState<number | null>(
    null,
  );
  const [flippedSegmentIndex, setFlippedSegmentIndex] = useState<number | null>(
    0,
  );
  const [metadataEditingIndex, setMetadataEditingIndex] = useState<
    number | null
  >(null);
  const [pendingReorder, setPendingReorder] = useState<DropResult | null>(null);
  const [mobileTextMode, setMobileTextMode] = useState<
    'hidden' | 'all' | 'single'
  >('hidden');
  const [showRecordPanel, setShowRecordPanel] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [flippedViewedOriginalIndices, setFlippedViewedOriginalIndices] =
    useState<Set<number>>(new Set());
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [skipCategory, setSkipCategory] = useState('');
  const [isCompleteRecordSubmitted, setIsCompleteRecordSubmitted] =
    useState(false);
  const [editReasons, setEditReasons] = useState<string[]>([]);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [charactersErrors, setCharactersErrors] = useState<
    Record<number, string>
  >({});

  const { value, suggestions, inputProps, setValue } = useTeluguTyping(
    editingSegmentIndex !== null
      ? (newValue) => handleSegmentChange(editingSegmentIndex, newValue)
      : undefined,
  );
  const [isTeluguTypingEnabled, setIsTeluguTypingEnabled] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const pendingDraftRef = useRef<DraftState | null>(null);

  const teluguEngineRef = useRef({ prevChar: '', prevLen: 0 });

  const handleTeluguKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!isTeluguTypingEnabled) return;
      if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) {
        teluguEngineRef.current = { prevChar: '', prevLen: 0 };
        return;
      }
      e.preventDefault();
      const engine = teluguEngineRef.current;
      const target = e.target as HTMLInputElement;
      const selStart = target.selectionStart ?? target.value.length;
      const selEnd = target.selectionEnd ?? target.value.length;
      const str = engine.prevChar + e.key;
      const result = transliterate(str);
      const textBefore = target.value.substring(0, selStart - engine.prevLen);
      const textAfter = target.value.substring(selEnd);
      const newValue = textBefore + result.str + textAfter;
      const nativeInputValue = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      );
      nativeInputValue?.set?.call(target, newValue);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      const newCursor = textBefore.length + result.str.length;
      target.selectionStart = newCursor;
      target.selectionEnd = newCursor;
      engine.prevChar = str.substring(result.freezpos);
      engine.prevLen = result.indic.length;
    },
    [isTeluguTypingEnabled],
  );
  const [hintsVisible, setHintsVisible] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.pageY - scrollContainerRef.current.offsetTop);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setScrollTop(scrollContainerRef.current.scrollTop);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();

    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const y = e.pageY - scrollContainerRef.current.offsetTop;

    const walkX = x - startX;
    const walkY = y - startY;

    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;
  };

  const getCurrentPageSegments = (): Segment[] => {
    return segmentsByPage.get(pageNumber) || [];
  };

  const handleSegmentChange = (segmentIndex: number, newValue: string) => {
    setValue(newValue);
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments && segmentIndex < pageSegments.length) {
        const updatedSegments = [...pageSegments];
        updatedSegments[segmentIndex] = {
          ...updatedSegments[segmentIndex],
          text: newValue,
        };
        newMap.set(pageNumber, updatedSegments);
        // Sync edit to all sibling pages sharing the same segment
        const editedSegment = updatedSegments[segmentIndex];
        if (editedSegment?.originalIndex !== undefined) {
          for (const [pg, segs] of newMap.entries()) {
            if (pg === pageNumber) continue;
            const sibIdx = segs.findIndex(
              (s) => s.originalIndex === editedSegment.originalIndex,
            );
            if (sibIdx !== -1) {
              const sibSegs = [...segs];
              sibSegs[sibIdx] = { ...sibSegs[sibIdx], text: newValue };
              newMap.set(pg, sibSegs);
            }
          }
        }
      }
      return newMap;
    });
  };

  const handleMetadataChange = (
    segmentIndex: number,
    field: 'extraction_metadata' | 'named_entities',
    key: string,
    newValue: string,
  ) => {
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments && segmentIndex < pageSegments.length) {
        const updatedSegments = [...pageSegments];
        const seg = { ...updatedSegments[segmentIndex] };
        const meta = seg[field]
          ? { ...seg[field] }
          : ({} as Record<string, unknown>);
        meta[key] = newValue;
        seg[field] = meta;
        updatedSegments[segmentIndex] = seg;
        newMap.set(pageNumber, updatedSegments);
        // Sync metadata edit to all sibling pages sharing the same segment
        const editedSegment = updatedSegments[segmentIndex];
        if (editedSegment?.originalIndex !== undefined) {
          for (const [pg, segs] of newMap.entries()) {
            if (pg === pageNumber) continue;
            const sibIdx = segs.findIndex(
              (s) => s.originalIndex === editedSegment.originalIndex,
            );
            if (sibIdx !== -1) {
              const sibSegs = [...segs];
              sibSegs[sibIdx] = { ...sibSegs[sibIdx], [field]: seg[field] };
              newMap.set(pg, sibSegs);
            }
          }
        }
      }
      return newMap;
    });
  };

  const handleNestedMetadataChange = (
    segmentIndex: number,
    field: 'extraction_metadata' | 'named_entities',
    parentKey: string,
    subKey: string,
    newValue: string,
  ) => {
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments && segmentIndex < pageSegments.length) {
        const updatedSegments = [...pageSegments];
        const seg = { ...updatedSegments[segmentIndex] };
        const meta = seg[field]
          ? { ...seg[field] }
          : ({} as Record<string, unknown>);
        const parent = meta[parentKey]
          ? { ...(meta[parentKey] as Record<string, unknown>) }
          : {};
        parent[subKey] = newValue;
        meta[parentKey] = parent;
        seg[field] = meta;
        updatedSegments[segmentIndex] = seg;
        newMap.set(pageNumber, updatedSegments);
        const editedSegment = updatedSegments[segmentIndex];
        if (editedSegment?.originalIndex !== undefined) {
          for (const [pg, segs] of newMap.entries()) {
            if (pg === pageNumber) continue;
            const sibIdx = segs.findIndex(
              (s) => s.originalIndex === editedSegment.originalIndex,
            );
            if (sibIdx !== -1) {
              const sibSegs = [...segs];
              sibSegs[sibIdx] = { ...sibSegs[sibIdx], [field]: seg[field] };
              newMap.set(pg, sibSegs);
            }
          }
        }
      }
      return newMap;
    });
  };

  const handleValidationFieldChange = (
    segmentIndex: number,
    field: string,
    value: string | string[],
  ) => {
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (!pageSegments || segmentIndex >= pageSegments.length) return prevMap;
      const updatedSegments = [...pageSegments];
      const seg = { ...updatedSegments[segmentIndex] };

      const currentCategory = String(seg.extraction_metadata?.category || '');

      switch (field) {
        case 'status':
          if (value === 'proofread') {
            seg.proofread = true;
            seg.skipped = false;
            seg.skip_reason = null;
          } else if (value === 'skipped') {
            seg.proofread = false;
            seg.skipped = true;
          }
          break;
        case 'category':
          seg.extraction_metadata = {
            ...(seg.extraction_metadata || {}),
            category: value,
          };
          break;
        case 'skip_reason':
          seg.skip_reason =
            value === '' || value === 'None' ? null : (value as string);
          break;
        case 'edits':
          seg.edit = value as string[];
          break;
      }

      updatedSegments[segmentIndex] = seg;
      newMap.set(pageNumber, updatedSegments);

      if (seg.originalIndex !== undefined) {
        for (const [pg, segs] of newMap.entries()) {
          if (pg === pageNumber) continue;
          const sibIdx = segs.findIndex(
            (s) => s.originalIndex === seg.originalIndex,
          );
          if (sibIdx !== -1) {
            const sibSegs = [...segs];
            sibSegs[sibIdx] = {
              ...sibSegs[sibIdx],
              proofread: seg.proofread,
              skipped: seg.skipped,
              skip_reason: seg.skip_reason,
              validated: seg.validated,
              edit: seg.edit,
              extraction_metadata: seg.extraction_metadata,
            };
            newMap.set(pg, sibSegs);
          }
        }
      }

      return newMap;
    });
  };

  const removeDictEntry = (
    segmentIndex: number,
    field: 'extraction_metadata' | 'named_entities',
    parentKey: string,
    subKey: string,
  ) => {
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments && segmentIndex < pageSegments.length) {
        const updatedSegments = [...pageSegments];
        const seg = { ...updatedSegments[segmentIndex] };
        const meta = seg[field]
          ? { ...seg[field] }
          : ({} as Record<string, unknown>);
        const parent = meta[parentKey]
          ? { ...(meta[parentKey] as Record<string, unknown>) }
          : {};
        delete parent[subKey];
        meta[parentKey] = parent;
        seg[field] = meta;
        updatedSegments[segmentIndex] = seg;
        newMap.set(pageNumber, updatedSegments);
        const editedSegment = updatedSegments[segmentIndex];
        if (editedSegment?.originalIndex !== undefined) {
          for (const [pg, segs] of newMap.entries()) {
            if (pg === pageNumber) continue;
            const sibIdx = segs.findIndex(
              (s) => s.originalIndex === editedSegment.originalIndex,
            );
            if (sibIdx !== -1) {
              const sibSegs = [...segs];
              sibSegs[sibIdx] = { ...sibSegs[sibIdx], [field]: seg[field] };
              newMap.set(pg, sibSegs);
            }
          }
        }
      }
      return newMap;
    });
  };

  const renameDictKey = (
    segmentIndex: number,
    field: 'extraction_metadata' | 'named_entities',
    parentKey: string,
    oldSubKey: string,
    newSubKey: string,
  ) => {
    if (oldSubKey === newSubKey) return;
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments && segmentIndex < pageSegments.length) {
        const updatedSegments = [...pageSegments];
        const seg = { ...updatedSegments[segmentIndex] };
        const meta = seg[field]
          ? { ...seg[field] }
          : ({} as Record<string, unknown>);
        const parent = meta[parentKey]
          ? { ...(meta[parentKey] as Record<string, unknown>) }
          : {};
        const value = parent[oldSubKey];
        delete parent[oldSubKey];
        if (newSubKey.trim()) {
          parent[newSubKey] = value;
        }
        meta[parentKey] = parent;
        seg[field] = meta;
        updatedSegments[segmentIndex] = seg;
        newMap.set(pageNumber, updatedSegments);
        const editedSegment = updatedSegments[segmentIndex];
        if (editedSegment?.originalIndex !== undefined) {
          for (const [pg, segs] of newMap.entries()) {
            if (pg === pageNumber) continue;
            const sibIdx = segs.findIndex(
              (s) => s.originalIndex === editedSegment.originalIndex,
            );
            if (sibIdx !== -1) {
              const sibSegs = [...segs];
              sibSegs[sibIdx] = { ...sibSegs[sibIdx], [field]: seg[field] };
              newMap.set(pg, sibSegs);
            }
          }
        }
      }
      return newMap;
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    setPendingReorder(result);
  };

  const confirmReorder = () => {
    if (!pendingReorder || !pendingReorder.destination) return;

    const sourceIndex = pendingReorder.source.index;
    const destinationIndex = pendingReorder.destination.index;

    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      const pageSegments = newMap.get(pageNumber);
      if (pageSegments) {
        const updatedSegments = [...pageSegments];
        const [reorderedItem] = updatedSegments.splice(sourceIndex, 1);
        updatedSegments.splice(destinationIndex, 0, reorderedItem);

        // Update reading_order for all segments in this page
        const reindexedSegments = updatedSegments.map((seg, idx) => ({
          ...seg,
          reading_order: idx + 1,
        }));

        newMap.set(pageNumber, reindexedSegments);
      }
      return newMap;
    });

    setPendingReorder(null);
  };

  const currentPageSegments = getCurrentPageSegments();
  const isLastPageOfSegment = currentPageSegments.some(
    (seg) => seg.end === pageNumber,
  );
  const validPages = useMemo(
    () => [...segmentsByPage.keys()].sort((a, b) => a - b),
    [segmentsByPage],
  );

  const pageRangeLabel = useMemo(() => {
    if (currentPageSegments.length === 0) return '';
    const pages = currentPageSegments.map((s) => s.start + 1);
    const minP = Math.min(...pages);
    const maxP = Math.max(...currentPageSegments.map((s) => s.end));
    return minP === maxP ? `Page ${minP}` : `Pages ${minP}-${maxP}`;
  }, [currentPageSegments]);

  const hasUnviewedMetadata = useMemo(
    () =>
      currentPageSegments.some(
        (seg) =>
          (seg.extraction_metadata || seg.named_entities) &&
          (IS_DOC_DIGITIZATION_VALIDATION ? !seg.validated : !seg.proofread) &&
          !seg.skipped &&
          seg.originalIndex !== undefined &&
          !flippedViewedOriginalIndices.has(seg.originalIndex),
      ),
    [currentPageSegments, flippedViewedOriginalIndices],
  );

  const hasIncompleteRequiredFields = useMemo(
    () =>
      currentPageSegments
        .filter((seg) => seg.end === pageNumber)
        .some((seg) => {
          if (seg.skipped) {
            const category = String(seg.extraction_metadata?.category || '');
            if (
              category === 'story' &&
              !(seg.skip_reason && seg.skip_reason.trim())
            ) {
              return true;
            }
            return false;
          }
          return !isSegmentComplete(seg);
        }),
    [currentPageSegments, pageNumber],
  );

  const hasBboxes = useMemo(() => {
    for (const pageSegments of segmentsByPage.values()) {
      if (pageSegments.some((seg) => seg.bbox)) return true;
    }
    return false;
  }, [segmentsByPage]);

  const isSkippedValid = useCallback((seg: Segment) => {
    if (!seg.skipped) return true;
    const category = String(seg.extraction_metadata?.category || '');
    if (category === 'story' && !(seg.skip_reason && seg.skip_reason.trim())) {
      return false;
    }
    return true;
  }, []);

  const proofreadPages = useMemo(() => {
    const pages = new Set<number>();
    segmentsByPage.forEach((segs, page) => {
      if (
        segs.length > 0 &&
        segs.every(
          (seg) => seg.proofread || (seg.skipped && isSkippedValid(seg)),
        )
      ) {
        pages.add(page);
      }
    });
    const validSet = new Set(validPages);
    return new Set([...pages].filter((p) => validSet.has(p)));
  }, [segmentsByPage, validPages, isSkippedValid]);

  const validatedPages = useMemo(() => {
    const pages = new Set<number>();
    segmentsByPage.forEach((segs, page) => {
      if (
        segs.length > 0 &&
        segs.every(
          (seg) => seg.validated || (seg.skipped && isSkippedValid(seg)),
        )
      ) {
        pages.add(page);
      }
    });
    const validSet = new Set(validPages);
    return new Set([...pages].filter((p) => validSet.has(p)));
  }, [segmentsByPage, validPages, isSkippedValid]);

  useEffect(() => {
    if (validPages.length > 0 && !validPages.includes(pageNumber)) {
      setPageNumber(validPages[0]);
    }
  }, [validPages, pageNumber]);

  useEffect(() => {
    setIsCompleteRecordSubmitted(false);
  }, [fullRecordData]);

  useEffect(() => {
    const draft = findAnyDraft();
    if (draft) {
      pendingDraftRef.current = draft;
      setShowResumeDialog(true);
    }
  }, []);

  const autosaveRef = useRef(false);
  useEffect(() => {
    if (!autosaveRef.current) {
      autosaveRef.current = true;
      return;
    }
    if (!recordId || segmentsByPage.size === 0) return;
    if (!hasSavedOrSkippedPages(segmentsByPage)) return;
    const timer = setTimeout(() => {
      saveDraft({
        recordId,
        pageNumber,
        segmentsByPageEntries: Array.from(segmentsByPage.entries()),
        flippedViewedOriginalIndicesArray: Array.from(
          flippedViewedOriginalIndices,
        ),
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [segmentsByPage, pageNumber, recordId, flippedViewedOriginalIndices]);

  useEffect(() => {
    function handleBeforeUnload() {
      if (!recordId || segmentsByPage.size === 0) return;
      if (!hasSavedOrSkippedPages(segmentsByPage)) return;
      saveDraft({
        recordId,
        pageNumber,
        segmentsByPageEntries: Array.from(segmentsByPage.entries()),
        flippedViewedOriginalIndicesArray: Array.from(
          flippedViewedOriginalIndices,
        ),
      });
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [recordId, pageNumber, segmentsByPage, flippedViewedOriginalIndices]);

  useEffect(() => {
    if (!pendingDraftRef.current) return;
    const draft = pendingDraftRef.current;
    const currentRecordId = recordId;
    if (draft.recordId !== currentRecordId) return;
    pendingDraftRef.current = null;
    setSegmentsByPage(new Map(draft.segmentsByPageEntries));
    setPageNumber(draft.pageNumber);
    setFlippedViewedOriginalIndices(
      new Set(draft.flippedViewedOriginalIndicesArray),
    );
    clearDraft(draft.recordId);
    toast.success(t('messages.draftRestoredSuccessfully'));
  }, [fullRecordData, recordId]);

  // Compute the reference dimensions for bbox overlay positioning.
  // Uses inferred OCR image dimensions when bbox coords are in pixel space,
  // otherwise falls back to the PDF page dimensions.
  const ocrRefDimensions = useMemo(() => {
    const inferred = getOcrReferenceDimensions(currentPageSegments);
    if (inferred) return inferred;
    return pdfPageSize;
  }, [currentPageSegments, pdfPageSize]);

  async function fetchRecordById(recordId: string) {
    setIsLoading(true);
    setError(null);
    setBookData(null);
    setRecordId(null);
    setFullRecordData(null);
    setPageNumber(1);
    setSegmentsByPage(new Map());
    setNumPages(0);

    const token = localStorage.getItem('token');
    try {
      const [recordDetailsResponse, recordUrlResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/records/${recordId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/records/${recordId}/record-url`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!recordDetailsResponse.ok) {
        if (recordDetailsResponse.status === 404) {
          throw new Error(`Record with ID "${recordId}" not found.`);
        }
        throw new Error(
          `Failed to fetch record details. Status: ${recordDetailsResponse.status}`,
        );
      }
      if (!recordUrlResponse.ok) {
        if (recordUrlResponse.status === 404) {
          throw new Error(`Record URL not found for record "${recordId}".`);
        }
        throw new Error(
          `Failed to fetch record URL. Status: ${recordUrlResponse.status}`,
        );
      }

      const recordDetails =
        (await recordDetailsResponse.json()) as RecordDetails;
      const urlData = await recordUrlResponse.json();

      setFullRecordData(recordDetails);
      setRecordId(recordId);

      const pdfUrl =
        urlData.url || urlData.signedUrl || urlData.record_url || urlData.link;

      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
        throw new Error('Could not find a valid URL in the API response.');
      }

      const segments = recordDetails.extracted_text?.segments || [];

      if (segments.length === 0) {
        throw new Error('No segments found in the record.');
      }

      segments.forEach((seg) => {
        const ner_characters = seg.named_entities?.ner_characters;
        if (Array.isArray(ner_characters)) {
          seg.named_entities!.ner_characters = Object.fromEntries(
            ner_characters.map((item: unknown) => [String(item), null]),
          );
        }
        if (recordDetails.category && !seg.extraction_metadata?.category) {
          seg.extraction_metadata = {
            ...seg.extraction_metadata,
            category: recordDetails.category,
          };
        }
        if (!seg.named_entities) {
          seg.named_entities = {};
        }
        if (!seg.named_entities.locations) {
          seg.named_entities.locations = '';
        }
        if (!seg.named_entities.characters) {
          seg.named_entities.characters = {};
        }
        if (!seg.extraction_metadata?.genre) {
          seg.extraction_metadata = {
            ...seg.extraction_metadata,
            genre: '',
          };
        }
        if (seg.validated === undefined) {
          seg.validated = false;
        }
      });

      const groupedSegments = groupSegmentsByPage(segments);
      const totalPages =
        segments.length > 0 ? Math.max(...segments.map((s) => s.start + 1)) : 0;

      setBookData({
        pdfUrl,
        metadata: {
          title: recordDetails.title,
          language: recordDetails.language,
          author: recordDetails.author,
          source: recordDetails.source,
        },
      });
      setSegmentsByPage(groupedSegments);
      setNumPages(totalPages);
      setPdfPageSize({ width: 0, height: 0 });
      setFlippedSegmentIndex(0);
    } catch (err) {
      const error = err as Error;
      console.error('An error occurred in fetchRecordById:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSearchRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRecordId.trim()) {
      setError('Please enter a record ID.');
      return;
    }
    setIsSearching(true);
    fetchRecordById(searchRecordId.trim()).finally(() => {
      setIsSearching(false);
    });
  };

  async function fetchNextRecord() {
    if (!areReviewFiltersReady) {
      return;
    }

    setMetadataEditingIndex(null);
    setFlippedSegmentIndex(null);
    setFlippedViewedOriginalIndices(new Set());
    setIsLoading(true);
    setError(null);
    setBookData(null);
    setRecordId(null);
    setFullRecordData(null);
    setPageNumber(1);
    setSegmentsByPage(new Map());
    setNumPages(0);
    setEditingSegmentIndex(null);

    const token = localStorage.getItem('token');
    try {
      const nextRecordResponse = await fetch(
        `${BACKEND_URL}/records/for-review`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: { ...reviewFilters, lock: true },
            limit: 1,
          }),
        },
      );

      if (!nextRecordResponse.ok) {
        const errorData = await nextRecordResponse.json();
        throw new Error(errorData.message || 'Failed to find the next record.');
      }

      const responseBody = await nextRecordResponse.json();
      const responseArray = responseBody.record_ids;
      if (!Array.isArray(responseArray) || responseArray.length === 0) {
        throw new Error('No new records are available for proofreading.');
      }
      const { record_id } = responseArray[0];
      setRecordId(record_id);

      const [recordDetailsResponse, recordUrlResponse] = await Promise.all([
        fetch(`${BACKEND_URL}/records/${record_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/records/${record_id}/record-url`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!recordDetailsResponse.ok) {
        throw new Error(
          `Failed to fetch record details. Status: ${recordDetailsResponse.status}`,
        );
      }
      if (!recordUrlResponse.ok) {
        throw new Error(
          `Failed to fetch record URL. Status: ${recordUrlResponse.status}`,
        );
      }

      const recordDetails =
        (await recordDetailsResponse.json()) as RecordDetails;
      const urlData = await recordUrlResponse.json();

      setFullRecordData(recordDetails);

      const pdfUrl =
        urlData.url || urlData.signedUrl || urlData.record_url || urlData.link;

      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
        throw new Error('Could not find a valid URL in the API response.');
      }

      const segments = recordDetails.extracted_text?.segments || [];

      if (segments.length === 0) {
        throw new Error('No segments found in the record.');
      }

      segments.forEach((seg) => {
        const ner_characters = seg.named_entities?.ner_characters;
        if (Array.isArray(ner_characters)) {
          seg.named_entities!.ner_characters = Object.fromEntries(
            ner_characters.map((item: unknown) => [String(item), null]),
          );
        }
        if (recordDetails.category && !seg.extraction_metadata?.category) {
          seg.extraction_metadata = {
            ...seg.extraction_metadata,
            category: recordDetails.category,
          };
        }
        if (!seg.named_entities) {
          seg.named_entities = {};
        }
        if (!seg.named_entities.locations) {
          seg.named_entities.locations = '';
        }
        if (!seg.named_entities.characters) {
          seg.named_entities.characters = {};
        }
        if (!seg.extraction_metadata?.genre) {
          seg.extraction_metadata = {
            ...seg.extraction_metadata,
            genre: '',
          };
        }
        if (seg.validated === undefined) {
          seg.validated = false;
        }
      });

      const groupedSegments = groupSegmentsByPage(segments);
      const totalPages =
        segments.length > 0 ? Math.max(...segments.map((s) => s.start + 1)) : 0;

      setBookData({
        pdfUrl,
        metadata: {
          title: recordDetails.title,
          language: recordDetails.language,
          author: recordDetails.author,
          source: recordDetails.source,
        },
      });
      setSegmentsByPage(groupedSegments);
      setNumPages(totalPages);
      setPdfPageSize({ width: 0, height: 0 });
      setFlippedSegmentIndex(0);
    } catch (err) {
      const error = err as Error;
      console.error('An error occurred in fetchNextRecord:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitPage() {
    if (!recordId || !fullRecordData) {
      toast.error('Cannot submit: No record is currently loaded.');
      return;
    }

    const unviewed = currentPageSegments.find(
      (seg) =>
        (seg.extraction_metadata || seg.named_entities) &&
        !seg.proofread &&
        !seg.skipped &&
        seg.originalIndex !== undefined &&
        !flippedViewedOriginalIndices.has(seg.originalIndex),
    );
    if (unviewed) {
      toast.error(
        t('common.pleaseFlipAndReviewMetadatanamedEntitiesBeforeSubmitting'),
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');

    const seenIndices = new Set<number>();
    const allSegments: Segment[] = [];
    segmentsByPage.forEach((pageSegments) => {
      pageSegments.forEach((seg) => {
        if (!seenIndices.has(seg.originalIndex!)) {
          seenIndices.add(seg.originalIndex!);
          allSegments.push(seg);
        }
      });
    });
    allSegments.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (a.reading_order !== undefined && b.reading_order !== undefined) {
        return a.reading_order - b.reading_order;
      }
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });

    const updatedSegments = allSegments.map(({ originalIndex, ...rest }) => ({
      ...rest,
      text: rest.text.trim() === '' ? ' ' : rest.text,
      validated: rest.validated ?? false,
      edit: rest.edit ?? [],
      proofread: rest.skipped ? false : true,
      skipped: !!rest.skipped,
      skip_reason:
        rest.skip_reason && rest.skip_reason.trim() ? rest.skip_reason : null,
      named_entities: {
        ...(rest.named_entities as Record<string, unknown>),
        locations:
          typeof (rest.named_entities as Record<string, unknown> | undefined)
            ?.locations === 'string'
            ? (rest.named_entities as Record<string, unknown>).locations
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : (rest.named_entities as Record<string, unknown> | undefined)
                ?.locations,
      },
      extraction_metadata: {
        ...((rest.extraction_metadata || {}) as Record<string, unknown>),
      },
    }));

    const requestBody: Record<string, unknown> = {
      extraction_type: fullRecordData.extracted_text?.extraction_type || 'OCR',
      segments: updatedSegments,
    };

    try {
      const response = await fetch(
        `${BACKEND_URL}/records/${recordId}/extracted_text`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail?.[0]?.msg ||
            'Failed to submit the proofread update.',
        );
      }

      toast.success(`Page ${pageNumber} submitted successfully!`);
      setIsCompleteRecordSubmitted(true);
      if (recordId) clearDraft(recordId);

      await fetchNextRecord();
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function cleanupEmptyCharacters() {
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      for (const [pg, segs] of newMap.entries()) {
        newMap.set(
          pg,
          segs.map((seg) => {
            if (!seg.named_entities?.characters) return seg;
            const chars = seg.named_entities.characters as Record<
              string,
              unknown
            >;
            const cleaned: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(chars)) {
              const keyTrimmed = k.trim();
              if (keyTrimmed === '' || k.startsWith('__new_')) continue;
              const valStr = String(v ?? '').trim();
              if (valStr === '') continue;
              cleaned[k] = v;
            }
            return {
              ...seg,
              named_entities: { ...seg.named_entities, characters: cleaned },
            };
          }),
        );
      }
      return newMap;
    });
  }

  function doneEditingMetadata() {
    if (metadataEditingIndex !== null) {
      const seg = currentPageSegments[metadataEditingIndex];
      const chars = (seg?.named_entities?.characters ?? {}) as Record<
        string,
        unknown
      >;
      const invalid = Object.entries(chars).some(([k, v]) => {
        const keyStr = String(k);
        const valStr = String(v ?? '');
        if (keyStr.startsWith('__new_')) return false;
        const keyFilled = keyStr.trim().length > 0;
        const valFilled = valStr.trim().length > 0;
        return (keyFilled || valFilled) && !(keyFilled && valFilled);
      });
      if (invalid) {
        setCharactersErrors((prev) => ({
          ...prev,
          [metadataEditingIndex]:
            'All character name and value fields must be filled.',
        }));
        return;
      }
      if (IS_DOC_DIGITIZATION_VALIDATION && seg) {
        const isSkipped = seg.skipped || false;
        const category = String(seg.extraction_metadata?.category || '');
        if (
          isSkipped &&
          category === 'story' &&
          !(seg.skip_reason && seg.skip_reason.trim())
        ) {
          toast.error(
            t('common.setASkipReasonBeforeCompletingEditsForStoryCategory'),
          );
          return;
        }
      }
    }
    cleanupEmptyCharacters();
    setMetadataEditingIndex(null);
    setCharactersErrors({});
  }

  function handleSavePage() {
    cleanupEmptyCharacters();
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      for (const [pg, segs] of newMap.entries()) {
        if (segs.some((seg) => seg.end === pageNumber)) {
          newMap.set(
            pg,
            segs.map((seg) =>
              seg.end === pageNumber
                ? {
                    ...seg,
                    proofread: true,
                    edit:
                      editReasons.length > 0
                        ? [...editReasons]
                        : (seg.edit ?? []),
                    extraction_metadata: {
                      ...(seg.extraction_metadata || {}),
                      category: 'story',
                    },
                  }
                : seg,
            ),
          );
        }
      }
      return newMap;
    });
    setEditReasons([]);

    const idx = validPages.indexOf(pageNumber);
    if (idx < validPages.length - 1) {
      setPageNumber(validPages[idx + 1]);
    }
  }

  function handleNextPage() {
    if (!isLastPageOfSegment) {
      toast.error(t('validation.mustBeOnTheLastPageOfTheSegmentToProceed'));
      return;
    }
    if (hasUnviewedMetadata) {
      toast.error(t('ui.flip.and.read.the.other.side'));
      return;
    }
    const missingFields = new Set<string>();
    currentPageSegments
      .filter((seg) => seg.end === pageNumber)
      .forEach((seg) => {
        if (seg.skipped) {
          const category = String(seg.extraction_metadata?.category || '');
          if (
            category === 'story' &&
            !(seg.skip_reason && seg.skip_reason.trim())
          ) {
            missingFields.add('skip reason');
          }
          return;
        }
        const meta = seg.extraction_metadata || {};
        if (!meta.genre || String(meta.genre).trim() === '')
          missingFields.add('genre');
        if (!meta.moral || String(meta.moral).trim() === '')
          missingFields.add('moral');
        if (!meta.title || String(meta.title).trim() === '')
          missingFields.add('title');
        if (!meta.author || String(meta.author).trim() === '')
          missingFields.add('author');
        const locs = seg.named_entities?.locations;
        if (
          !locs ||
          (typeof locs === 'string' && locs.trim() === '') ||
          (Array.isArray(locs) && locs.length === 0)
        )
          missingFields.add('locations');
        const chars = seg.named_entities?.characters as
          | Record<string, unknown>
          | undefined;
        if (
          !chars ||
          Object.entries(chars).filter(([k]) => !k.startsWith('__new_'))
            .length === 0
        )
          missingFields.add('characters');
        if (!(seg.edit && seg.edit.length > 0)) missingFields.add('edits');
      });
    if (missingFields.size > 0) {
      toast.error(`Complete required fields: ${[...missingFields].join(', ')}`);
      return;
    }
    cleanupEmptyCharacters();
    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      for (const [pg, segs] of newMap.entries()) {
        if (segs.some((seg) => seg.end === pageNumber)) {
          newMap.set(
            pg,
            segs.map((seg) =>
              seg.end === pageNumber
                ? {
                    ...seg,
                    validated: true,
                    edit:
                      editReasons.length > 0
                        ? [...editReasons]
                        : (seg.edit ?? []),
                    extraction_metadata: {
                      ...(seg.extraction_metadata || {}),
                      category: seg.extraction_metadata?.category || 'story',
                    },
                  }
                : seg,
            ),
          );
        }
      }
      return newMap;
    });
    setEditReasons([]);

    const idx = validPages.indexOf(pageNumber);
    if (idx < validPages.length - 1) {
      setPageNumber(validPages[idx + 1]);
    }
  }

  function handleSkip() {
    cleanupEmptyCharacters();
    const segmentIndices = new Set<number>();
    currentPageSegments.forEach((seg) => {
      if (seg.originalIndex !== undefined) {
        segmentIndices.add(seg.originalIndex);
      }
    });

    setSegmentsByPage((prevMap) => {
      const newMap = new Map(prevMap);
      for (const [pg, segs] of newMap.entries()) {
        newMap.set(
          pg,
          segs.map((seg) =>
            seg.originalIndex !== undefined &&
            segmentIndices.has(seg.originalIndex)
              ? {
                  ...seg,
                  skipped: true,
                  skip_reason: skipReason,
                  extraction_metadata: {
                    ...(seg.extraction_metadata || {}),
                    category: skipCategory,
                  },
                }
              : seg,
          ),
        );
      }
      return newMap;
    });

    setShowSkipModal(false);
    setSkipReason('');
    setSkipCategory('');

    const maxEnd = Math.max(...currentPageSegments.map((seg) => seg.end));
    const nextPage = validPages.find((p) => p > maxEnd);
    if (nextPage) {
      setPageNumber(nextPage);
    }

    if (recordId) {
      setSegmentsByPage((prevMap) => {
        saveDraft({
          recordId,
          pageNumber,
          segmentsByPageEntries: Array.from(prevMap.entries()),
          flippedViewedOriginalIndicesArray: Array.from(
            flippedViewedOriginalIndices,
          ),
        });
        return prevMap;
      });
    }
  }

  function handleResume() {
    const draft = pendingDraftRef.current;
    if (!draft) return;
    setShowResumeDialog(false);
    pendingDraftRef.current = draft;
    fetchRecordById(draft.recordId);
  }

  function handleDiscardDraft() {
    const draft = pendingDraftRef.current;
    if (draft) clearDraft(draft.recordId);
    pendingDraftRef.current = null;
    setShowResumeDialog(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* --- Header with Back and Record Buttons --- */}
      <div className="relative flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            window.location.href = '/tools';
          }}
          className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-10 h-10 rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <NetworkStrengthIndicator />
          {currentPageSegments.some(
            (seg) => seg.extraction_metadata || seg.named_entities,
          ) && (
            <div className="relative">
              <button
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 w-8 h-8 rounded-full p-1.5 transition-colors"
                title="Button conditions"
              >
                <Info className="h-full w-full" />
              </button>
              {showInfoPanel && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 text-xs text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                      {t('common.button.conditions')}
                    </h3>
                    <button
                      onClick={() => setShowInfoPanel(false)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3 rotate-90" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {t('common.general.conditions')}
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>{t('validation.mustBeOnLastPageOfSegment')}</li>
                        <li>{t('common.metadataMustBeReviewedFlipped')}</li>
                        <li>{t('common.cannotBeInEditMode')}</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {t('categories.categoryStory')}
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>
                          {t('common.saveActiveOnLastPageAllConditionsApply')}
                        </li>
                        <li>
                          {t('common.skipActiveOnLastPageAllConditionsApply')}
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {t('common.categoryNonstory')}
                      </p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>{t('common.saveDisabled')}</li>
                        <li>
                          {t('common.skipActiveWhenCategorySetAndNotEditing')}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <button
              onClick={() => setShowRecordPanel(!showRecordPanel)}
              className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 font-bold text-sm rounded-lg transition-colors"
            >
              Record
            </button>

            {/* Record Popup Panel */}
            {showRecordPanel && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    {t('media.recordControls')}
                  </h3>
                  <button
                    onClick={() => setShowRecordPanel(false)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 rotate-90" />
                  </button>
                </div>
                <div className="space-y-3">
                  <form onSubmit={handleSearchRecord} className="space-y-2">
                    <input
                      type="text"
                      value={searchRecordId}
                      onChange={(e) => setSearchRecordId(e.target.value)}
                      placeholder={t('media.enterRecordId')}
                      className="w-full px-3 py-2 rounded text-gray-900 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      disabled={isSearching || isLoading}
                    />
                    <button
                      type="submit"
                      className="w-full bg-purple-600 text-white hover:bg-purple-700 font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
                      disabled={
                        isSearching || isLoading || !searchRecordId.trim()
                      }
                    >
                      {isSearching ? t('common.loading') : 'Search'}
                    </button>
                  </form>
                  <button
                    className="w-full bg-green-600 text-white hover:bg-green-700 font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
                    onClick={fetchNextRecord}
                    disabled={
                      isLoading || isSearching || !areReviewFiltersReady
                    }
                  >
                    {isLoading
                      ? t('common.loading')
                      : t('proofreading.getNextRecord')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto">
        {/* --- Mobile First: PDF Viewer at Top --- */}
        <div className="w-full p-3 border-b border-gray-300 dark:border-gray-700 md:hidden">
          {bookData ? (
            <>
              {/* Mobile Toolbar with Progress, Nav and Zoom */}
              <div className="flex flex-col bg-gray-200 dark:bg-gray-800 rounded-lg mb-2 p-2 gap-2">
                {/* Progress Bar (Single Line) */}
                <div className="w-full px-1 space-y-1">
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-gray-500">
                    <span>Progress</span>
                    <span>
                      {
                        (IS_DOC_DIGITIZATION_VALIDATION
                          ? validatedPages
                          : proofreadPages
                        ).size
                      }{' '}
                      / {validPages.length}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/20 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 transition-all duration-500 ease-out"
                      style={{
                        width: `${((IS_DOC_DIGITIZATION_VALIDATION ? validatedPages : proofreadPages).size / (validPages.length || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2">
                  {/* Navigation Arrows & Dropdown */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const idx = validPages.indexOf(pageNumber);
                        if (idx > 0) setPageNumber(validPages[idx - 1]);
                      }}
                      disabled={validPages.indexOf(pageNumber) <= 0}
                      className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="relative group">
                      <select
                        value={pageNumber}
                        onChange={(e) => setPageNumber(Number(e.target.value))}
                        className="appearance-none bg-white/10 dark:bg-gray-700 border border-white/20 dark:border-gray-600 text-gray-900 dark:text-gray-300 text-[10px] font-black py-1 pl-2 pr-6 rounded focus:outline-none cursor-pointer"
                      >
                        {validPages.map((p) => (
                          <option
                            key={`mobile_zoom_page_opt_${p}`}
                            value={p}
                            className={
                              (IS_DOC_DIGITIZATION_VALIDATION
                                ? validatedPages
                                : proofreadPages
                              ).has(p)
                                ? 'text-green-600 font-bold'
                                : 'text-gray-900'
                            }
                          >
                            P{p}{' '}
                            {(IS_DOC_DIGITIZATION_VALIDATION
                              ? validatedPages
                              : proofreadPages
                            ).has(p)
                              ? '✓'
                              : ''}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="h-3 w-3 text-white/60" />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const idx = validPages.indexOf(pageNumber);
                        if (idx < validPages.length - 1)
                          setPageNumber(validPages[idx + 1]);
                      }}
                      disabled={
                        validPages.indexOf(pageNumber) >= validPages.length - 1
                      }
                      className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors rotate-180"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="h-6 w-[1px] bg-gray-400 dark:bg-gray-500" />

                  {/* Zoom Controls */}
                  <div className="flex items-center">
                    <button
                      className="px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded text-xs font-bold"
                      onClick={() =>
                        setZoom((prev) => Math.max(0.2, prev - 0.2))
                      }
                    >
                      -
                    </button>
                    <span className="font-semibold mx-2 text-[10px]">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      className="px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded text-xs font-bold"
                      onClick={() => setZoom((prev) => prev + 0.2)}
                    >
                      +
                    </button>
                  </div>

                  <div className="h-6 w-[1px] bg-gray-400 dark:bg-gray-500" />

                  {/* BBox Toggle */}
                  {hasBboxes && (
                    <button
                      className={`p-1 rounded text-[8px] font-black uppercase transition-colors ${
                        showBboxes
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                      }`}
                      onClick={() => setShowBboxes(!showBboxes)}
                    >
                      {showBboxes ? 'BBox' : 'Off'}
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full h-[500px] overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                <div className="relative" style={{ width: 'max-content' }}>
                  <Document
                    file={bookData.pdfUrl}
                    loading="Loading PDF..."
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={zoom}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      onLoadSuccess={(page) => {
                        setPdfPageSize({
                          width: page.originalWidth || 0,
                          height: page.originalHeight || 0,
                        });
                      }}
                    />
                  </Document>
                  {/* Bounding Box Overlays */}
                  {showBboxes && pdfPageSize.width > 0 && (
                    <div className="absolute inset-0 pointer-events-none">
                      {currentPageSegments.map((segment, idx) => {
                        const normalizedBox = normalizeBbox(segment.bbox);
                        const overlayStyle = buildOverlayStyle(
                          normalizedBox,
                          ocrRefDimensions.width,
                          ocrRefDimensions.height,
                        );
                        if (!overlayStyle) return null;

                        const colorClasses = getBboxColorClasses(segment.type);

                        return (
                          <div
                            key={`bbox_overlay_mobile_${idx}`}
                            className={`absolute border-2 transition-colors cursor-pointer pointer-events-auto ${colorClasses.box}`}
                            style={overlayStyle}
                            onClick={() => {
                              setHighlightedSegmentIndex(idx);
                              setMobileTextMode('single');
                              // Scroll to corresponding segment editor
                              const segmentElement = document.getElementById(
                                `segment_edit_mobile_${idx}`,
                              );
                              if (segmentElement) {
                                segmentElement.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center',
                                });
                              }
                            }}
                            title={`Segment ${idx + 1}: ${segment.text?.substring(0, 50) || ''}...`}
                          >
                            <span
                              className={`absolute -top-5 left-0 px-1.5 py-0.5 text-xs font-bold rounded text-white ${colorClasses.label}`}
                            >
                              {idx + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center mt-2 px-3">
                <button
                  onClick={() =>
                    setMobileTextMode((prev) =>
                      prev === 'all' ? 'hidden' : 'all',
                    )
                  }
                  className="w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold rounded-lg border border-purple-200 dark:border-purple-800 transition-colors hover:bg-purple-200"
                >
                  {mobileTextMode === 'all'
                    ? t('common.hideCompleteText')
                    : t('common.showCompleteText')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full p-4">
              <p className="text-xl">
                {isLoading
                  ? 'Fetching record...'
                  : 'Please get a record to begin.'}
              </p>
            </div>
          )}
        </div>

        {/* --- Mobile: OCR Text Editor with Segments --- */}
        <div className="w-full p-3 border-b border-gray-300 dark:border-gray-700 md:hidden">
          <div className="flex flex-col items-center justify-center gap-1 mb-3">
            <h2 className="text-lg font-bold text-center">
              {t('common.proofread.ocr.text')}
            </h2>
            {currentPageSegments.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {pageRangeLabel} - {currentPageSegments.length} segment
                {currentPageSegments.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Mobile Segments - Conditional rendering */}
          <div className="space-y-1 mt-2">
            {mobileTextMode === 'all' && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="mobile-segments">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-1"
                    >
                      {currentPageSegments.map((segment, idx) => (
                        <Draggable
                          key={`draggable-mobile-${idx}`}
                          draggableId={`draggable-mobile-${idx}`}
                          index={idx}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              id={`segment_edit_mobile_${idx}`}
                              className={`group relative flex gap-2 p-1 rounded transition-all duration-300 ${
                                snapshot.isDragging
                                  ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg z-50'
                                  : highlightedSegmentIndex === idx
                                    ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500 shadow-sm'
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-800'
                              }`}
                            >
                              {/* Sidebar metadata & Drag Handle */}
                              <div className="w-6 flex-shrink-0 flex flex-col items-center pt-1 border-r border-gray-200 dark:border-gray-700 pr-1 relative">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mb-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                >
                                  <ChevronDown className="h-3 w-3 -mb-1" />
                                  <ChevronUp className="h-3 w-3 -mt-1" />
                                </div>
                                <span className="text-[8px] font-bold text-gray-400">
                                  {idx + 1}
                                </span>
                                {(segment.extraction_metadata ||
                                  segment.named_entities) &&
                                  (IS_DOC_DIGITIZATION_VALIDATION
                                    ? !segment.validated
                                    : !segment.proofread) &&
                                  segment.originalIndex !== undefined &&
                                  !flippedViewedOriginalIndices.has(
                                    segment.originalIndex,
                                  ) && (
                                    <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                                  )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-start items-center gap-2 h-4">
                                  {flippedSegmentIndex === idx ? (
                                    <>
                                      {metadataEditingIndex !== idx ? (
                                        <button
                                          onClick={() => {
                                            const seg =
                                              currentPageSegments[idx];
                                            if (seg) {
                                              const chars = (seg.named_entities
                                                ?.characters ?? {}) as Record<
                                                string,
                                                unknown
                                              >;
                                              const count =
                                                Object.keys(chars).length;
                                              if (count < 1) {
                                                handleNestedMetadataChange(
                                                  idx,
                                                  'named_entities',
                                                  'characters',
                                                  '__new_0',
                                                  '',
                                                );
                                              }
                                            }
                                            setMetadataEditingIndex(idx);
                                            setCharactersErrors({});
                                          }}
                                          className="opacity-0 group-hover:opacity-100 px-2 py-0 bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-bold rounded transition-opacity"
                                        >
                                          Edit
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => doneEditingMetadata()}
                                          className="px-2 py-0 bg-green-500 hover:bg-green-600 text-white text-[8px] font-bold rounded"
                                        >
                                          Done
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setEditingSegmentIndex(null);
                                          doneEditingMetadata();
                                          setFlippedSegmentIndex(null);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 px-1.5 py-0 bg-purple-600 text-white text-[8px] font-bold rounded transition-opacity"
                                      >
                                        <RotateCw className="h-3 w-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {editingSegmentIndex === idx ? (
                                        <button
                                          onClick={() =>
                                            setEditingSegmentIndex(null)
                                          }
                                          className="px-2 py-0 bg-green-500 hover:bg-green-600 text-white text-[8px] font-bold rounded"
                                        >
                                          Done
                                        </button>
                                      ) : isCompleteRecordSubmitted ? (
                                        <button
                                          onClick={() =>
                                            setEditingSegmentIndex(idx)
                                          }
                                          className="opacity-0 group-hover:opacity-100 px-2 py-0 bg-blue-500 hover:bg-blue-600 text-white text-[8px] font-bold rounded transition-opacity"
                                        >
                                          Edit
                                        </button>
                                      ) : null}
                                      {(segment.extraction_metadata ||
                                        segment.named_entities) && (
                                        <button
                                          onClick={() => {
                                            setEditingSegmentIndex(null);
                                            doneEditingMetadata();
                                            setFlippedViewedOriginalIndices(
                                              (prev) => {
                                                const next = new Set(prev);
                                                if (
                                                  segment.originalIndex !==
                                                  undefined
                                                )
                                                  next.add(
                                                    segment.originalIndex,
                                                  );
                                                return next;
                                              },
                                            );
                                            setFlippedSegmentIndex(idx);
                                          }}
                                          className={`opacity-0 group-hover:opacity-100 px-1.5 py-0 text-[8px] font-bold rounded transition-opacity bg-gray-400 hover:bg-gray-500 text-white`}
                                        >
                                          <RotateCw className="h-3 w-3" />
                                        </button>
                                      )}
                                      <span className="opacity-0 group-hover:opacity-100 text-[8px] uppercase tracking-wider text-gray-400 font-bold transition-opacity">
                                        {segment.type || 'Text'}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {flippedSegmentIndex === idx ? (
                                  <div className="space-y-2 mt-1">
                                    {IS_DOC_DIGITIZATION_VALIDATION && (
                                      <div className="text-[11px] space-y-1 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                                        <div>
                                          <span className="font-bold text-gray-600 dark:text-gray-400">
                                            status:{' '}
                                          </span>
                                          {metadataEditingIndex === idx ? (
                                            <select
                                              value={
                                                segment.skipped
                                                  ? 'skipped'
                                                  : 'proofread'
                                              }
                                              onChange={(e) =>
                                                handleValidationFieldChange(
                                                  idx,
                                                  'status',
                                                  e.target.value,
                                                )
                                              }
                                              className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px]"
                                            >
                                              <option value="proofread">
                                                Proofread
                                              </option>
                                              <option value="skipped">
                                                Skipped
                                              </option>
                                            </select>
                                          ) : (
                                            <span
                                              className={
                                                segment.proofread
                                                  ? 'text-green-600 font-semibold'
                                                  : 'text-orange-600 font-semibold'
                                              }
                                            >
                                              {segment.proofread
                                                ? 'Proofread'
                                                : segment.skipped
                                                  ? 'Skipped'
                                                  : 'Pending'}
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <span className="font-bold text-gray-600 dark:text-gray-400">
                                            category:{' '}
                                          </span>
                                          {metadataEditingIndex === idx ? (
                                            <select
                                              value={String(
                                                segment.extraction_metadata
                                                  ?.category || '',
                                              )}
                                              onChange={(e) =>
                                                handleValidationFieldChange(
                                                  idx,
                                                  'category',
                                                  e.target.value,
                                                )
                                              }
                                              className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px]"
                                            >
                                              <option value="">None</option>
                                              <option value="poem">poem</option>
                                              <option value="story">
                                                story
                                              </option>
                                              <option value="interview">
                                                interview
                                              </option>
                                              <option value="article">
                                                article
                                              </option>
                                              <option value="editorial">
                                                editorial
                                              </option>
                                              <option value="miscellaneous">
                                                miscellaneous
                                              </option>
                                            </select>
                                          ) : (
                                            <span className="text-gray-800 dark:text-gray-200">
                                              {String(
                                                segment.extraction_metadata
                                                  ?.category || 'None',
                                              )}
                                            </span>
                                          )}
                                        </div>
                                        {segment.skipped && (
                                          <div>
                                            <span className="font-bold text-gray-600 dark:text-gray-400">
                                              skip reason:{' '}
                                            </span>
                                            {metadataEditingIndex === idx ? (
                                              <select
                                                value={
                                                  segment.skip_reason || 'None'
                                                }
                                                onChange={(e) =>
                                                  handleValidationFieldChange(
                                                    idx,
                                                    'skip_reason',
                                                    e.target.value,
                                                  )
                                                }
                                                className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px]"
                                              >
                                                <option value="None">
                                                  None
                                                </option>
                                                <option value="Unclear page">
                                                  Unclear page
                                                </option>
                                                <option value="Other">
                                                  Other
                                                </option>
                                              </select>
                                            ) : (
                                              <span className="text-gray-800 dark:text-gray-200">
                                                {segment.skip_reason || 'None'}
                                              </span>
                                            )}
                                          </div>
                                        )}
                                        <div>
                                          <span className="font-bold text-gray-600 dark:text-gray-400">
                                            edits:{' '}
                                          </span>
                                          {metadataEditingIndex === idx ? (
                                            <div className="ml-2 space-y-1 mt-1">
                                              {[
                                                'grammatical fixes',
                                                'rearrangement',
                                                'others',
                                              ].map((reason) => (
                                                <label
                                                  key={reason}
                                                  className="flex items-center gap-1 text-[11px] cursor-pointer"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={
                                                      segment.edit?.includes(
                                                        reason,
                                                      ) ?? false
                                                    }
                                                    onChange={(e) => {
                                                      const current =
                                                        segment.edit ?? [];
                                                      const next = e.target
                                                        .checked
                                                        ? [...current, reason]
                                                        : current.filter(
                                                            (r) => r !== reason,
                                                          );
                                                      handleValidationFieldChange(
                                                        idx,
                                                        'edits',
                                                        next,
                                                      );
                                                    }}
                                                    className="cursor-pointer"
                                                  />
                                                  {reason}
                                                </label>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-gray-800 dark:text-gray-200">
                                              {segment.edit &&
                                              segment.edit.length > 0
                                                ? segment.edit.join(', ')
                                                : 'None'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {metadataEditingIndex === idx ? (
                                      <div className="text-[11px]">
                                        <span className="font-bold text-gray-600 dark:text-gray-400">
                                          genre:
                                        </span>
                                        <select
                                          value={
                                            (segment.extraction_metadata
                                              ?.genre as string) || ''
                                          }
                                          onChange={(e) =>
                                            handleMetadataChange(
                                              idx,
                                              'extraction_metadata',
                                              'genre',
                                              e.target.value,
                                            )
                                          }
                                          className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px]"
                                        >
                                          <option value="">
                                            Select genre...
                                          </option>
                                          <option value="social">social</option>
                                          <option value="mythology">
                                            mythology
                                          </option>
                                          <option value="fantasy">
                                            fantasy
                                          </option>
                                          <option value="folklore">
                                            folklore
                                          </option>
                                          <option value="fables">fables</option>
                                          <option value="others">others</option>
                                        </select>
                                      </div>
                                    ) : (
                                      <div className="text-[11px]">
                                        <span className="font-bold text-gray-600 dark:text-gray-400">
                                          genre:
                                        </span>{' '}
                                        <span className="text-gray-800 dark:text-gray-200">
                                          {(segment.extraction_metadata
                                            ?.genre as string) || ''}
                                        </span>
                                      </div>
                                    )}
                                    {segment.extraction_metadata &&
                                      Object.entries(
                                        segment.extraction_metadata,
                                      )
                                        .filter(
                                          ([key]) =>
                                            key !== 'category' &&
                                            key !== 'ner_genre' &&
                                            key !== 'genre' &&
                                            key !== 'keywords',
                                        )
                                        .map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="text-[11px]"
                                          >
                                            <span className="font-bold text-gray-600 dark:text-gray-400">
                                              {key}:
                                            </span>{' '}
                                            {metadataEditingIndex === idx ? (
                                              <input
                                                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px] w-full mt-0.5"
                                                value={String(value)}
                                                onKeyDown={handleTeluguKeyDown}
                                                onChange={(e) =>
                                                  handleMetadataChange(
                                                    idx,
                                                    'extraction_metadata',
                                                    key,
                                                    e.target.value,
                                                  )
                                                }
                                              />
                                            ) : (
                                              <span className="text-gray-800 dark:text-gray-200">
                                                {Array.isArray(value)
                                                  ? value.join(', ')
                                                  : String(value)}
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                    {segment.named_entities &&
                                      Object.entries(segment.named_entities)
                                        .filter(
                                          ([key]) =>
                                            key !== 'ner_locations' &&
                                            key !== 'keywords' &&
                                            key !== 'ner_characters',
                                        )
                                        .map(([key, value]) => {
                                          const isDict =
                                            typeof value === 'object' &&
                                            value !== null &&
                                            !Array.isArray(value);
                                          if (isDict) {
                                            return (
                                              <div
                                                key={key}
                                                className="text-[11px]"
                                              >
                                                <span className="font-bold text-gray-600 dark:text-gray-400">
                                                  {key}:
                                                </span>
                                                <div className="ml-2 space-y-1 mt-1">
                                                  {Object.entries(
                                                    value as Record<
                                                      string,
                                                      unknown
                                                    >,
                                                  )
                                                    .filter(
                                                      ([subKey]) =>
                                                        metadataEditingIndex ===
                                                          idx ||
                                                        !subKey.startsWith(
                                                          '__new_',
                                                        ),
                                                    )
                                                    .map(
                                                      (
                                                        [subKey, subValue],
                                                        index,
                                                      ) => (
                                                        <div
                                                          key={index}
                                                          className="flex items-center gap-1"
                                                        >
                                                          {metadataEditingIndex ===
                                                            idx &&
                                                          key ===
                                                            'characters' ? (
                                                            <input
                                                              className={`w-20 bg-white dark:bg-gray-700 border ${charactersErrors[idx] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded px-1 py-0.5 text-[11px]`}
                                                              defaultValue={
                                                                String(
                                                                  subKey,
                                                                ).startsWith(
                                                                  '__new_',
                                                                )
                                                                  ? ''
                                                                  : subKey
                                                              }
                                                              onKeyDown={
                                                                handleTeluguKeyDown
                                                              }
                                                              onBlur={(e) => {
                                                                if (
                                                                  e.target
                                                                    .value !==
                                                                  subKey
                                                                ) {
                                                                  renameDictKey(
                                                                    idx,
                                                                    'named_entities',
                                                                    key,
                                                                    subKey,
                                                                    e.target
                                                                      .value,
                                                                  );
                                                                }
                                                              }}
                                                            />
                                                          ) : (
                                                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                              {subKey}:
                                                            </span>
                                                          )}
                                                          {metadataEditingIndex ===
                                                          idx ? (
                                                            <input
                                                              className={`flex-1 bg-white dark:bg-gray-700 border ${charactersErrors[idx] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded px-1 py-0.5 text-[11px]`}
                                                              value={
                                                                subValue ===
                                                                null
                                                                  ? ''
                                                                  : String(
                                                                      subValue,
                                                                    )
                                                              }
                                                              onKeyDown={
                                                                handleTeluguKeyDown
                                                              }
                                                              onChange={(e) =>
                                                                handleNestedMetadataChange(
                                                                  idx,
                                                                  'named_entities',
                                                                  key,
                                                                  subKey,
                                                                  e.target
                                                                    .value,
                                                                )
                                                              }
                                                            />
                                                          ) : (
                                                            <span className="text-gray-800 dark:text-gray-200">
                                                              {subValue === null
                                                                ? ''
                                                                : String(
                                                                    subValue,
                                                                  )}
                                                            </span>
                                                          )}
                                                          {metadataEditingIndex ===
                                                            idx &&
                                                            key ===
                                                              'characters' &&
                                                            (() => {
                                                              const entries =
                                                                Object.entries(
                                                                  value as Record<
                                                                    string,
                                                                    unknown
                                                                  >,
                                                                );
                                                              return (
                                                                entries.length ===
                                                                  0 ||
                                                                entries.every(
                                                                  ([k, v]) => {
                                                                    const keyStr =
                                                                      String(k);
                                                                    const valStr =
                                                                      String(
                                                                        v ?? '',
                                                                      );
                                                                    if (
                                                                      keyStr.startsWith(
                                                                        '__new_',
                                                                      )
                                                                    )
                                                                      return false;
                                                                    return (
                                                                      keyStr.trim()
                                                                        .length >
                                                                        0 &&
                                                                      valStr.trim()
                                                                        .length >
                                                                        0
                                                                    );
                                                                  },
                                                                )
                                                              );
                                                            })() && (
                                                              <button
                                                                onClick={() =>
                                                                  removeDictEntry(
                                                                    idx,
                                                                    'named_entities',
                                                                    key,
                                                                    subKey,
                                                                  )
                                                                }
                                                                className="text-red-500 hover:text-red-700 text-[11px] font-bold ml-1"
                                                              >
                                                                -
                                                              </button>
                                                            )}
                                                        </div>
                                                      ),
                                                    )}
                                                  {metadataEditingIndex ===
                                                    idx &&
                                                    key === 'characters' &&
                                                    (() => {
                                                      const seg =
                                                        currentPageSegments[
                                                          idx
                                                        ];
                                                      const chars = (seg
                                                        ?.named_entities
                                                        ?.characters ??
                                                        {}) as Record<
                                                        string,
                                                        unknown
                                                      >;
                                                      const entries =
                                                        Object.entries(chars);
                                                      return (
                                                        entries.length === 0 ||
                                                        entries.every(
                                                          ([k, v]) => {
                                                            const keyStr =
                                                              String(k);
                                                            const valStr =
                                                              String(v ?? '');
                                                            if (
                                                              keyStr.startsWith(
                                                                '__new_',
                                                              )
                                                            )
                                                              return false;
                                                            return (
                                                              keyStr.trim()
                                                                .length > 0 &&
                                                              valStr.trim()
                                                                .length > 0
                                                            );
                                                          },
                                                        )
                                                      );
                                                    })() && (
                                                      <button
                                                        onClick={() =>
                                                          handleNestedMetadataChange(
                                                            idx,
                                                            'named_entities',
                                                            key,
                                                            '',
                                                            '',
                                                          )
                                                        }
                                                        className="text-blue-500 hover:text-blue-700 text-[11px] font-bold mt-1"
                                                      >
                                                        +
                                                      </button>
                                                    )}
                                                  {charactersErrors[idx] &&
                                                    idx ===
                                                      metadataEditingIndex && (
                                                      <p className="text-red-500 text-[10px] mt-1">
                                                        {charactersErrors[idx]}
                                                      </p>
                                                    )}
                                                </div>
                                              </div>
                                            );
                                          }
                                          return (
                                            <div
                                              key={key}
                                              className="text-[11px]"
                                            >
                                              <span className="font-bold text-gray-600 dark:text-gray-400">
                                                {key}:
                                              </span>{' '}
                                              {metadataEditingIndex === idx ? (
                                                <input
                                                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-[11px] w-full mt-0.5"
                                                  value={String(value)}
                                                  onKeyDown={
                                                    handleTeluguKeyDown
                                                  }
                                                  onChange={(e) =>
                                                    handleMetadataChange(
                                                      idx,
                                                      'named_entities',
                                                      key,
                                                      e.target.value,
                                                    )
                                                  }
                                                />
                                              ) : (
                                                <span className="text-gray-800 dark:text-gray-200">
                                                  {Array.isArray(value)
                                                    ? value.join(', ')
                                                    : String(value)}
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })}
                                  </div>
                                ) : editingSegmentIndex === idx ? (
                                  <AutoResizeTextArea
                                    value={segment.text || ''}
                                    onChange={(e) =>
                                      handleSegmentChange(idx, e.target.value)
                                    }
                                    onKeyDown={
                                      isTeluguTypingEnabled
                                        ? inputProps.onKeyDown
                                        : undefined
                                    }
                                    placeholder={t(
                                      'ui.ocr.text.will.appear.here',
                                    )}
                                    disabled={
                                      !bookData || isLoading || isSubmitting
                                    }
                                  />
                                ) : (
                                  <div className="w-full whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100 p-0 rounded">
                                    {segment.text || ''}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {mobileTextMode === 'single' &&
              highlightedSegmentIndex !== null &&
              currentPageSegments[highlightedSegmentIndex] && (
                <div className="fixed bottom-20 left-4 right-4 z-[100] p-3 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border-2 border-purple-500 animate-in slide-in-from-bottom duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-600 text-white text-xs font-bold">
                        {highlightedSegmentIndex + 1}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-500">
                        {currentPageSegments[highlightedSegmentIndex].type ||
                          'Text'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMobileTextMode('hidden');
                        setHighlightedSegmentIndex(null);
                      }}
                      className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-1.5 rounded-full transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-90" />
                    </button>
                  </div>

                  <div className="max-h-[40vh] overflow-y-auto">
                    <div className="flex justify-start items-center gap-2 mb-2">
                      {editingSegmentIndex === highlightedSegmentIndex ? (
                        <button
                          onClick={() => setEditingSegmentIndex(null)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                        >
                          Done
                        </button>
                      ) : isCompleteRecordSubmitted ? (
                        <button
                          onClick={() =>
                            setEditingSegmentIndex(highlightedSegmentIndex)
                          }
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded shadow-sm transition-colors"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                    {editingSegmentIndex === highlightedSegmentIndex ? (
                      <AutoResizeTextArea
                        value={
                          currentPageSegments[highlightedSegmentIndex].text ||
                          ''
                        }
                        onChange={(e) =>
                          handleSegmentChange(
                            highlightedSegmentIndex,
                            e.target.value,
                          )
                        }
                        onKeyDown={
                          isTeluguTypingEnabled
                            ? inputProps.onKeyDown
                            : undefined
                        }
                        placeholder={t('ui.ocr.text.will.appear.here')}
                        disabled={!bookData || isLoading || isSubmitting}
                      />
                    ) : (
                      <div className="w-full whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100 border border-transparent p-0 rounded">
                        {currentPageSegments[highlightedSegmentIndex].text ||
                          ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          {hintsVisible && <SuggestionBar suggestions={suggestions} />}
        </div>

        {/* --- Desktop: Side-by-side layout remains unchanged --- */}
        <div className="hidden md:flex md:flex-row w-full h-full overflow-hidden">
          {/* --- Main Content --- */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* PDF Viewer */}
              <div className="w-1/2 flex flex-col p-5 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
                {bookData ? (
                  <>
                    {/* Progress Bar above toolbar */}
                    <div className="w-full px-1 mb-2 space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        <span>{t('common.overall.progress')}</span>
                        <span>
                          {
                            (IS_DOC_DIGITIZATION_VALIDATION
                              ? validatedPages
                              : proofreadPages
                            ).size
                          }{' '}
                          / {validPages.length}
                        </span>
                      </div>
                      <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-500 ease-out"
                          style={{
                            width: `${((IS_DOC_DIGITIZATION_VALIDATION ? validatedPages : proofreadPages).size / (validPages.length || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex justify-center items-center mb-4 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg gap-4">
                      {/* Navigation Arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const idx = validPages.indexOf(pageNumber);
                            if (idx > 0) setPageNumber(validPages[idx - 1]);
                          }}
                          disabled={validPages.indexOf(pageNumber) <= 0}
                          className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors"
                          title={t('common.previousPage')}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div className="relative">
                          <select
                            value={pageNumber}
                            onChange={(e) =>
                              setPageNumber(Number(e.target.value))
                            }
                            className="appearance-none bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-[9px] font-black py-1 pl-2 pr-7 rounded uppercase tracking-tighter focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition-colors"
                          >
                            {validPages.map((p) => (
                              <option
                                key={`desktop_page_opt_${p}`}
                                value={p}
                                className={
                                  (IS_DOC_DIGITIZATION_VALIDATION
                                    ? validatedPages
                                    : proofreadPages
                                  ).has(p)
                                    ? 'text-green-600 font-bold'
                                    : 'text-gray-900 dark:text-gray-100'
                                }
                              >
                                Page {p}{' '}
                                {(IS_DOC_DIGITIZATION_VALIDATION
                                  ? validatedPages
                                  : proofreadPages
                                ).has(p)
                                  ? '✓'
                                  : ''}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown className="h-3.5 w-3.5 text-gray-500 opacity-100" />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const idx = validPages.indexOf(pageNumber);
                            if (idx < validPages.length - 1)
                              setPageNumber(validPages[idx + 1]);
                          }}
                          disabled={
                            validPages.indexOf(pageNumber) >=
                            validPages.length - 1
                          }
                          className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 disabled:opacity-30 transition-colors rotate-180"
                          title={t('common.nextPage')}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="h-6 w-[1px] bg-gray-400 dark:bg-gray-500" />

                      {/* Zoom Controls */}
                      <div className="flex items-center">
                        <button
                          className="mx-1 px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-xs font-bold"
                          onClick={() =>
                            setZoom((prev) => Math.max(0.2, prev - 0.2))
                          }
                        >
                          -
                        </button>
                        <span className="font-bold w-10 text-center text-xs">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          className="mx-1 px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors text-xs font-bold"
                          onClick={() => setZoom((prev) => prev + 0.2)}
                        >
                          +
                        </button>
                      </div>

                      <div className="h-6 w-[1px] bg-gray-400 dark:bg-gray-500" />

                      {/* Toggle Buttons */}
                      {hasBboxes && (
                        <button
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-tight transition-colors ${
                            showBboxes
                              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          onClick={() => setShowBboxes(!showBboxes)}
                        >
                          {showBboxes ? 'Hide BBoxes' : 'Show BBoxes'}
                        </button>
                      )}
                    </div>
                    {/* PDF viewer with bounding box overlays */}
                    <div
                      ref={scrollContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeaveOrUp}
                      onMouseUp={handleMouseLeaveOrUp}
                      onMouseMove={handleMouseMove}
                      className="flex-grow min-h-[300px] p-2 overflow-auto bg-gray-100 dark:bg-gray-900"
                    >
                      <div
                        className="relative"
                        style={{ width: 'fit-content', margin: '0 auto' }}
                      >
                        <div className="relative">
                          <Document
                            file={bookData.pdfUrl}
                            loading="Loading PDF..."
                            className="inline-block"
                            onLoadSuccess={({ numPages }) =>
                              setNumPages(numPages)
                            }
                          >
                            <Page
                              pageNumber={pageNumber}
                              scale={zoom}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              onLoadSuccess={(page) => {
                                setPdfPageSize({
                                  width: page.originalWidth || 0,
                                  height: page.originalHeight || 0,
                                });
                              }}
                            />
                          </Document>
                          {/* Bounding Box Overlays */}
                          {showBboxes && pdfPageSize.width > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                              {currentPageSegments.map((segment, idx) => {
                                const normalizedBox = normalizeBbox(
                                  segment.bbox,
                                );
                                const overlayStyle = buildOverlayStyle(
                                  normalizedBox,
                                  ocrRefDimensions.width,
                                  ocrRefDimensions.height,
                                );
                                if (!overlayStyle) return null;

                                const colorClasses = getBboxColorClasses(
                                  segment.type,
                                );

                                return (
                                  <div
                                    key={`bbox_overlay_desktop_${idx}`}
                                    className={`absolute border-2 transition-colors cursor-pointer pointer-events-auto ${colorClasses.box}`}
                                    style={overlayStyle}
                                    onClick={() => {
                                      setHighlightedSegmentIndex(idx);
                                      // Scroll to corresponding segment editor
                                      const segmentElement =
                                        document.getElementById(
                                          `segment_editor_${idx}`,
                                        );
                                      if (segmentElement) {
                                        segmentElement.scrollIntoView({
                                          behavior: 'smooth',
                                          block: 'center',
                                        });
                                      }
                                      setTimeout(
                                        () => setHighlightedSegmentIndex(null),
                                        3000,
                                      );
                                    }}
                                    title={`Segment ${idx + 1}: ${segment.text?.substring(0, 50) || ''}...`}
                                  >
                                    <span
                                      className={`absolute -top-5 left-0 px-1.5 py-0.5 text-xs font-bold rounded text-white ${colorClasses.label}`}
                                    >
                                      {idx + 1}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-xl">
                      {isLoading
                        ? t('proofreading.fetchingRecord')
                        : t('proofreading.pleaseGetRecord')}
                    </p>
                  </div>
                )}
              </div>

              {/* OCR Text Editor with Segments */}
              <div className="w-1/2 flex flex-col p-5 relative">
                <div className="flex flex-row justify-between items-start mb-3">
                  <div>
                    <h2 className="text-xl font-bold flex-shrink-0">
                      {t('common.proofread.ocr.text')}
                    </h2>
                    {currentPageSegments.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {pageRangeLabel} - {currentPageSegments.length} segment
                        {currentPageSegments.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {hintsVisible && (
                      <p className="text-sm">
                        {t('ui.start.typing.to.get.hints')}
                      </p>
                    )}

                    <div>
                      <div className="flex gap-1 items-center">
                        <input
                          className="cursor-pointer"
                          id="telugu-toggle"
                          type="checkbox"
                          checked={isTeluguTypingEnabled}
                          onChange={() =>
                            setIsTeluguTypingEnabled(!isTeluguTypingEnabled)
                          }
                        />
                        <label
                          className="cursor-pointer"
                          htmlFor="telugu-toggle"
                        >
                          {t('languages.telugu')}
                        </label>
                      </div>

                      {isTeluguTypingEnabled && (
                        <div className="flex gap-1 items-center">
                          <input
                            id="telugu-hints-toggle"
                            type="checkbox"
                            checked={hintsVisible}
                            onChange={() => setHintsVisible(!hintsVisible)}
                          />
                          <label htmlFor="telugu-hints-toggle">
                            Show Hints
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Segments List - All segments for current page */}
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="desktop-segments">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-grow overflow-y-auto space-y-1"
                      >
                        {currentPageSegments.length > 0 ? (
                          currentPageSegments.map((segment, idx) => (
                            <Draggable
                              key={`draggable-desktop-${idx}`}
                              draggableId={`draggable-desktop-${idx}`}
                              index={idx}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  id={`segment_editor_${idx}`}
                                  className={`group relative flex gap-3 p-1 rounded transition-all duration-300 ${
                                    snapshot.isDragging
                                      ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg z-50'
                                      : highlightedSegmentIndex === idx
                                        ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500 shadow-sm'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                  }`}
                                >
                                  {/* Sidebar metadata & Drag Handle */}
                                  <div className="w-8 flex-shrink-0 flex flex-col items-center pt-2 border-r border-gray-200 dark:border-gray-700 pr-2 relative">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mb-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                    >
                                      <ChevronDown className="h-3 w-3 -mb-1" />
                                      <ChevronUp className="h-3 w-3 -mt-1" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400">
                                      {idx + 1}
                                    </span>
                                    {(segment.extraction_metadata ||
                                      segment.named_entities) &&
                                      (IS_DOC_DIGITIZATION_VALIDATION
                                        ? !segment.validated
                                        : !segment.proofread) &&
                                      segment.originalIndex !== undefined &&
                                      !flippedViewedOriginalIndices.has(
                                        segment.originalIndex,
                                      ) && (
                                        <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                                      )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-start items-center gap-2 h-4">
                                      {flippedSegmentIndex === idx ? (
                                        <>
                                          {metadataEditingIndex !== idx ? (
                                            <button
                                              onClick={() => {
                                                const seg =
                                                  currentPageSegments[idx];
                                                if (seg) {
                                                  const chars = (seg
                                                    .named_entities
                                                    ?.characters ??
                                                    {}) as Record<
                                                    string,
                                                    unknown
                                                  >;
                                                  const count =
                                                    Object.keys(chars).length;
                                                  if (count < 1) {
                                                    handleNestedMetadataChange(
                                                      idx,
                                                      'named_entities',
                                                      'characters',
                                                      '__new_0',
                                                      '',
                                                    );
                                                  }
                                                }
                                                setMetadataEditingIndex(idx);
                                                setCharactersErrors({});
                                              }}
                                              className="opacity-0 group-hover:opacity-100 px-2 py-0 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded transition-opacity"
                                            >
                                              Edit
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                doneEditingMetadata()
                                              }
                                              className="px-2 py-0 bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold rounded"
                                            >
                                              Done
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setEditingSegmentIndex(null);
                                              doneEditingMetadata();
                                              setFlippedSegmentIndex(null);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 px-1.5 py-0 bg-purple-600 text-white text-[9px] font-bold rounded transition-opacity"
                                          >
                                            <RotateCw className="h-3 w-3" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {editingSegmentIndex === idx ? (
                                            <button
                                              onClick={() =>
                                                setEditingSegmentIndex(null)
                                              }
                                              className="px-2 py-0 bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold rounded"
                                            >
                                              Done
                                            </button>
                                          ) : isCompleteRecordSubmitted ? (
                                            <button
                                              onClick={() =>
                                                setEditingSegmentIndex(idx)
                                              }
                                              className="opacity-0 group-hover:opacity-100 px-2 py-0 bg-blue-500 hover:bg-blue-600 text-white text-[9px] font-bold rounded transition-opacity"
                                            >
                                              Edit
                                            </button>
                                          ) : null}
                                          {(segment.extraction_metadata ||
                                            segment.named_entities) && (
                                            <button
                                              onClick={() => {
                                                setEditingSegmentIndex(null);
                                                doneEditingMetadata();
                                                setFlippedViewedOriginalIndices(
                                                  (prev) => {
                                                    const next = new Set(prev);
                                                    if (
                                                      segment.originalIndex !==
                                                      undefined
                                                    )
                                                      next.add(
                                                        segment.originalIndex,
                                                      );
                                                    return next;
                                                  },
                                                );
                                                setFlippedSegmentIndex(idx);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 px-1.5 py-0 text-[9px] font-bold rounded transition-opacity bg-gray-400 hover:bg-gray-500 text-white"
                                            >
                                              <RotateCw className="h-3 w-3" />
                                            </button>
                                          )}
                                          <span className="opacity-0 group-hover:opacity-100 text-[9px] uppercase tracking-wider text-gray-400 font-bold transition-opacity">
                                            {segment.type || 'Text'}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    {flippedSegmentIndex === idx ? (
                                      <div className="space-y-2 mt-1">
                                        {IS_DOC_DIGITIZATION_VALIDATION && (
                                          <div className="text-xs space-y-1 mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-700">
                                            <div>
                                              <span className="font-bold text-gray-600 dark:text-gray-400">
                                                {t('categories.status')}{' '}
                                              </span>
                                              {metadataEditingIndex === idx ? (
                                                <select
                                                  value={
                                                    segment.skipped
                                                      ? 'skipped'
                                                      : 'proofread'
                                                  }
                                                  onChange={(e) =>
                                                    handleValidationFieldChange(
                                                      idx,
                                                      'status',
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs"
                                                >
                                                  <option value="proofread">
                                                    Proofread
                                                  </option>
                                                  <option value="skipped">
                                                    Skipped
                                                  </option>
                                                </select>
                                              ) : (
                                                <span
                                                  className={
                                                    segment.proofread
                                                      ? 'text-green-600 font-semibold'
                                                      : 'text-orange-600 font-semibold'
                                                  }
                                                >
                                                  {segment.proofread
                                                    ? 'Proofread'
                                                    : segment.skipped
                                                      ? 'Skipped'
                                                      : 'Pending'}
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              <span className="font-bold text-gray-600 dark:text-gray-400">
                                                category:{' '}
                                              </span>
                                              {metadataEditingIndex === idx ? (
                                                <select
                                                  value={String(
                                                    segment.extraction_metadata
                                                      ?.category || '',
                                                  )}
                                                  onChange={(e) =>
                                                    handleValidationFieldChange(
                                                      idx,
                                                      'category',
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs"
                                                >
                                                  <option value="">None</option>
                                                  <option value="poem">
                                                    poem
                                                  </option>
                                                  <option value="story">
                                                    story
                                                  </option>
                                                  <option value="interview">
                                                    interview
                                                  </option>
                                                  <option value="article">
                                                    article
                                                  </option>
                                                  <option value="editorial">
                                                    editorial
                                                  </option>
                                                  <option value="miscellaneous">
                                                    miscellaneous
                                                  </option>
                                                </select>
                                              ) : (
                                                <span className="text-gray-800 dark:text-gray-200">
                                                  {String(
                                                    segment.extraction_metadata
                                                      ?.category || 'None',
                                                  )}
                                                </span>
                                              )}
                                            </div>
                                            {segment.skipped && (
                                              <div>
                                                <span className="font-bold text-gray-600 dark:text-gray-400">
                                                  {t('common.skip.reason')}{' '}
                                                </span>
                                                {metadataEditingIndex ===
                                                idx ? (
                                                  <select
                                                    value={
                                                      segment.skip_reason ||
                                                      'None'
                                                    }
                                                    onChange={(e) =>
                                                      handleValidationFieldChange(
                                                        idx,
                                                        'skip_reason',
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs"
                                                  >
                                                    <option value="None">
                                                      None
                                                    </option>
                                                    <option value="Unclear page">
                                                      Unclear page
                                                    </option>
                                                    <option value="Other">
                                                      Other
                                                    </option>
                                                  </select>
                                                ) : (
                                                  <span className="text-gray-800 dark:text-gray-200">
                                                    {segment.skip_reason ||
                                                      'None'}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            <div>
                                              <span className="font-bold text-gray-600 dark:text-gray-400">
                                                {t('common.edits')}{' '}
                                              </span>
                                              {metadataEditingIndex === idx ? (
                                                <div className="ml-2 space-y-1 mt-1">
                                                  {[
                                                    'grammatical fixes',
                                                    'rearrangement',
                                                    'others',
                                                  ].map((reason) => (
                                                    <label
                                                      key={reason}
                                                      className="flex items-center gap-1 text-xs cursor-pointer"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={
                                                          segment.edit?.includes(
                                                            reason,
                                                          ) ?? false
                                                        }
                                                        onChange={(e) => {
                                                          const current =
                                                            segment.edit ?? [];
                                                          const next = e.target
                                                            .checked
                                                            ? [
                                                                ...current,
                                                                reason,
                                                              ]
                                                            : current.filter(
                                                                (r) =>
                                                                  r !== reason,
                                                              );
                                                          handleValidationFieldChange(
                                                            idx,
                                                            'edits',
                                                            next,
                                                          );
                                                        }}
                                                        className="cursor-pointer"
                                                      />
                                                      {reason}
                                                    </label>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-gray-800 dark:text-gray-200">
                                                  {segment.edit &&
                                                  segment.edit.length > 0
                                                    ? segment.edit.join(', ')
                                                    : 'None'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                        {metadataEditingIndex === idx ? (
                                          <div className="text-xs">
                                            <span className="font-bold text-gray-600 dark:text-gray-400">
                                              {t('common.genre')}
                                            </span>
                                            <select
                                              value={
                                                (segment.extraction_metadata
                                                  ?.genre as string) || ''
                                              }
                                              onChange={(e) =>
                                                handleMetadataChange(
                                                  idx,
                                                  'extraction_metadata',
                                                  'genre',
                                                  e.target.value,
                                                )
                                              }
                                              className="ml-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs"
                                            >
                                              <option value="">
                                                {t('common.selectGenre')}
                                              </option>
                                              <option value="social">
                                                social
                                              </option>
                                              <option value="mythology">
                                                mythology
                                              </option>
                                              <option value="fantasy">
                                                fantasy
                                              </option>
                                              <option value="folklore">
                                                folklore
                                              </option>
                                              <option value="fables">
                                                fables
                                              </option>
                                              <option value="others">
                                                others
                                              </option>
                                            </select>
                                          </div>
                                        ) : (
                                          <div className="text-xs">
                                            <span className="font-bold text-gray-600 dark:text-gray-400">
                                              genre:
                                            </span>{' '}
                                            <span className="text-gray-800 dark:text-gray-200">
                                              {(segment.extraction_metadata
                                                ?.genre as string) || ''}
                                            </span>
                                          </div>
                                        )}
                                        {segment.extraction_metadata &&
                                          Object.entries(
                                            segment.extraction_metadata,
                                          )
                                            .filter(
                                              ([key]) =>
                                                key !== 'category' &&
                                                key !== 'ner_genre' &&
                                                key !== 'genre' &&
                                                key !== 'keywords',
                                            )
                                            .map(([key, value]) => (
                                              <div
                                                key={key}
                                                className="text-xs"
                                              >
                                                <span className="font-bold text-gray-600 dark:text-gray-400">
                                                  {key}:
                                                </span>{' '}
                                                {metadataEditingIndex ===
                                                idx ? (
                                                  <input
                                                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs w-full mt-0.5"
                                                    value={String(value)}
                                                    onKeyDown={
                                                      handleTeluguKeyDown
                                                    }
                                                    onChange={(e) =>
                                                      handleMetadataChange(
                                                        idx,
                                                        'extraction_metadata',
                                                        key,
                                                        e.target.value,
                                                      )
                                                    }
                                                  />
                                                ) : (
                                                  <span className="text-gray-800 dark:text-gray-200">
                                                    {Array.isArray(value)
                                                      ? value.join(', ')
                                                      : String(value)}
                                                  </span>
                                                )}
                                              </div>
                                            ))}
                                        {segment.named_entities &&
                                          Object.entries(segment.named_entities)
                                            .filter(
                                              ([key]) =>
                                                key !== 'ner_locations' &&
                                                key !== 'keywords' &&
                                                key !== 'ner_characters',
                                            )
                                            .map(([key, value]) => {
                                              const isDict =
                                                typeof value === 'object' &&
                                                value !== null &&
                                                !Array.isArray(value);
                                              if (isDict) {
                                                return (
                                                  <div
                                                    key={key}
                                                    className="text-xs"
                                                  >
                                                    <span className="font-bold text-gray-600 dark:text-gray-400">
                                                      {key}:
                                                    </span>
                                                    <div className="ml-2 space-y-1 mt-1">
                                                      {Object.entries(
                                                        value as Record<
                                                          string,
                                                          unknown
                                                        >,
                                                      )
                                                        .filter(
                                                          ([subKey]) =>
                                                            metadataEditingIndex ===
                                                              idx ||
                                                            !subKey.startsWith(
                                                              '__new_',
                                                            ),
                                                        )
                                                        .map(
                                                          (
                                                            [subKey, subValue],
                                                            index,
                                                          ) => (
                                                            <div
                                                              key={index}
                                                              className="flex items-center gap-1"
                                                            >
                                                              {metadataEditingIndex ===
                                                                idx &&
                                                              key ===
                                                                'characters' ? (
                                                                <input
                                                                  className={`w-20 bg-white dark:bg-gray-700 border ${charactersErrors[idx] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded px-1 py-0.5 text-xs`}
                                                                  defaultValue={
                                                                    String(
                                                                      subKey,
                                                                    ).startsWith(
                                                                      '__new_',
                                                                    )
                                                                      ? ''
                                                                      : subKey
                                                                  }
                                                                  onKeyDown={
                                                                    handleTeluguKeyDown
                                                                  }
                                                                  onBlur={(
                                                                    e,
                                                                  ) => {
                                                                    if (
                                                                      e.target
                                                                        .value !==
                                                                      subKey
                                                                    ) {
                                                                      renameDictKey(
                                                                        idx,
                                                                        'named_entities',
                                                                        key,
                                                                        subKey,
                                                                        e.target
                                                                          .value,
                                                                      );
                                                                    }
                                                                  }}
                                                                />
                                                              ) : (
                                                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                                                  {subKey}:
                                                                </span>
                                                              )}
                                                              {metadataEditingIndex ===
                                                              idx ? (
                                                                <input
                                                                  className={`flex-1 bg-white dark:bg-gray-700 border ${charactersErrors[idx] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded px-1 py-0.5 text-xs`}
                                                                  value={
                                                                    subValue ===
                                                                    null
                                                                      ? ''
                                                                      : String(
                                                                          subValue,
                                                                        )
                                                                  }
                                                                  onKeyDown={
                                                                    handleTeluguKeyDown
                                                                  }
                                                                  onChange={(
                                                                    e,
                                                                  ) =>
                                                                    handleNestedMetadataChange(
                                                                      idx,
                                                                      'named_entities',
                                                                      key,
                                                                      subKey,
                                                                      e.target
                                                                        .value,
                                                                    )
                                                                  }
                                                                />
                                                              ) : (
                                                                <span className="text-gray-800 dark:text-gray-200">
                                                                  {subValue ===
                                                                  null
                                                                    ? ''
                                                                    : String(
                                                                        subValue,
                                                                      )}
                                                                </span>
                                                              )}
                                                              {metadataEditingIndex ===
                                                                idx &&
                                                                key ===
                                                                  'characters' && (
                                                                  <button
                                                                    onClick={() =>
                                                                      removeDictEntry(
                                                                        idx,
                                                                        'named_entities',
                                                                        key,
                                                                        subKey,
                                                                      )
                                                                    }
                                                                    className="text-red-500 hover:text-red-700 text-xs font-bold ml-1"
                                                                  >
                                                                    -
                                                                  </button>
                                                                )}
                                                            </div>
                                                          ),
                                                        )}
                                                      {metadataEditingIndex ===
                                                        idx &&
                                                        key === 'characters' &&
                                                        (() => {
                                                          const seg =
                                                            currentPageSegments[
                                                              idx
                                                            ];
                                                          const chars = (seg
                                                            ?.named_entities
                                                            ?.characters ??
                                                            {}) as Record<
                                                            string,
                                                            unknown
                                                          >;
                                                          const entries =
                                                            Object.entries(
                                                              chars,
                                                            );
                                                          return (
                                                            entries.length ===
                                                              0 ||
                                                            entries.every(
                                                              ([k, v]) => {
                                                                const keyStr =
                                                                  String(k);
                                                                const valStr =
                                                                  String(
                                                                    v ?? '',
                                                                  );
                                                                if (
                                                                  keyStr.startsWith(
                                                                    '__new_',
                                                                  )
                                                                )
                                                                  return false;
                                                                return (
                                                                  keyStr.trim()
                                                                    .length >
                                                                    0 &&
                                                                  valStr.trim()
                                                                    .length > 0
                                                                );
                                                              },
                                                            )
                                                          );
                                                        })() && (
                                                          <button
                                                            onClick={() =>
                                                              handleNestedMetadataChange(
                                                                idx,
                                                                'named_entities',
                                                                key,
                                                                '',
                                                                '',
                                                              )
                                                            }
                                                            className="text-blue-500 hover:text-blue-700 text-xs font-bold mt-1"
                                                          >
                                                            +
                                                          </button>
                                                        )}
                                                      {charactersErrors[idx] &&
                                                        idx ===
                                                          metadataEditingIndex && (
                                                          <p className="text-red-500 text-[10px] mt-1">
                                                            {
                                                              charactersErrors[
                                                                idx
                                                              ]
                                                            }
                                                          </p>
                                                        )}
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              return (
                                                <div
                                                  key={key}
                                                  className="text-xs"
                                                >
                                                  <span className="font-bold text-gray-600 dark:text-gray-400">
                                                    {key}:
                                                  </span>{' '}
                                                  {metadataEditingIndex ===
                                                  idx ? (
                                                    <input
                                                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs w-full mt-0.5"
                                                      value={String(value)}
                                                      onKeyDown={
                                                        handleTeluguKeyDown
                                                      }
                                                      onChange={(e) =>
                                                        handleMetadataChange(
                                                          idx,
                                                          'named_entities',
                                                          key,
                                                          e.target.value,
                                                        )
                                                      }
                                                    />
                                                  ) : (
                                                    <span className="text-gray-800 dark:text-gray-200">
                                                      {Array.isArray(value)
                                                        ? value.join(', ')
                                                        : String(value)}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                      </div>
                                    ) : editingSegmentIndex === idx ? (
                                      <AutoResizeTextArea
                                        placeholder={t(
                                          'common.editSegmentText',
                                        )}
                                        value={segment.text || ''}
                                        onChange={(e) =>
                                          handleSegmentChange(
                                            idx,
                                            e.target.value,
                                          )
                                        }
                                        onKeyDown={
                                          isTeluguTypingEnabled
                                            ? inputProps.onKeyDown
                                            : undefined
                                        }
                                        disabled={
                                          !bookData || isLoading || isSubmitting
                                        }
                                      />
                                    ) : (
                                      <div className="w-full whitespace-pre-wrap text-sm leading-relaxed text-gray-900 dark:text-gray-100 p-0 rounded">
                                        {segment.text || ''}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            {t('common.noSegmentsFoundForThisPage')}
                          </p>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {hintsVisible && isTeluguTypingEnabled && (
                  <SuggestionBar suggestions={suggestions} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button Section */}
        <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col sm:flex-row justify-center gap-4">
          {!IS_DOC_DIGITIZATION_VALIDATION && (
            <button
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded disabled:opacity-50 border-none"
              onClick={() => {
                setSkipCategory('');
                setSkipReason('');
                setShowSkipModal(true);
              }}
            >
              <SkipForward className="inline h-4 w-4 mr-1" />
              Skip
            </button>
          )}
          {IS_DOC_DIGITIZATION_VALIDATION ? (
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
              onClick={handleNextPage}
              disabled={isSubmitting || metadataEditingIndex !== null}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
              onClick={() => setShowSaveConfirm(true)}
              disabled={
                isSubmitting ||
                hasUnviewedMetadata ||
                !isLastPageOfSegment ||
                hasIncompleteRequiredFields ||
                metadataEditingIndex !== null
              }
            >
              {t('common.savePage')}
            </button>
          )}
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
            onClick={() => setShowSubmitConfirm(true)}
            disabled={
              isSubmitting ||
              validPages.length === 0 ||
              (IS_DOC_DIGITIZATION_VALIDATION
                ? validatedPages.size < validPages.length
                : proofreadPages.size < validPages.length) ||
              hasUnviewedMetadata ||
              metadataEditingIndex !== null
            }
          >
            {isSubmitting
              ? 'Submitting...'
              : (
                    IS_DOC_DIGITIZATION_VALIDATION
                      ? validatedPages.size === validPages.length
                      : proofreadPages.size === validPages.length
                  )
                ? t('common.submitCompleteRecord')
                : 'Submit all pages to enable'}
          </button>
        </div>
      </div>

      <AlertDialog
        open={!!pendingReorder}
        onOpenChange={(open) => !open && setPendingReorder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.update.reading.order')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'messages.areYouSureYouWantToUpdateTheReadingOrderOfTheseSegmentsThisWillAlsoUpdateTheBoundingBoxSequence',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReorder}>
              {t('common.update.order')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save this page?</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'common.thisIsTheLastPageOfTheSegmentSelectTheTypesOfEditsMade',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-2 space-y-2">
            {['grammatical fixes', 'rearrangement', 'others'].map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={editReasons.includes(reason)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditReasons([...editReasons, reason]);
                    } else {
                      setEditReasons(editReasons.filter((r) => r !== reason));
                    }
                  }}
                  className="cursor-pointer"
                />
                {reason}
              </label>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setEditReasons([]);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleSavePage();
                setShowSaveConfirm(false);
              }}
            >
              Yes, Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Complete Record</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 pt-2">
                <p>
                  {t(
                    'media.1AreYouSureAllTheTextSegmentsAreValidatedToThePageImagesProvided',
                  )}
                </p>
                <p>
                  {t(
                    'messages.2AreYouSureAllTheMetadataTitleGenreCharacterEtcAreValidatedAndApprovedForTheSegments',
                  )}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitPage}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showSkipModal} onOpenChange={setShowSkipModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('media.skipRecord')}</DialogTitle>
            <DialogDescription>
              {skipCategory === 'story'
                ? 'Story category requires a mandatory skip reason.'
                : 'Optionally provide a reason for skipping this record.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={skipCategory}
              onChange={(e) => setSkipCategory(e.target.value)}
            >
              <option value="">Select category...</option>
              <option value="poem">poem</option>
              <option value="story">story</option>
              <option value="interview">interview</option>
              <option value="article">article</option>
              <option value="editorial">editorial</option>
              <option value="miscellaneous">miscellaneous</option>
            </select>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
            >
              <option value="">{t('common.selectAReason')}</option>
              <option value="Unclear page">{t('common.unclearPage')}</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <DialogFooter>
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              onClick={() => {
                setShowSkipModal(false);
                setSkipReason('');
                setSkipCategory('');
              }}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              onClick={handleSkip}
              disabled={
                !skipCategory ||
                (skipCategory === 'story' && !skipReason.trim())
              }
            >
              {t('common.confirmSkip')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('common.resumePreviousSession')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.youHaveAnUnsavedDraftForRecord')}{' '}
              <strong>{pendingDraftRef.current?.recordId}</strong>.{' '}
              {t('common.doYouWantToResume')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              {t('common.startFresh')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume}>
              {t('common.resume')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DocDigitization;
