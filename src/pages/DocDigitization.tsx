import { SuggestionBar } from '@/components/SuggestionBar';
import { AutoResizeTextArea } from '@/components/AutoResizeTextArea';
import { useTeluguTyping } from '@/hooks/useTeluguTyping';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { BACKEND_URL } from '@/lib/constants';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Type definitions for segment-based OCR
type Segment = {
  start: number;
  end: number;
  text: string;
  confidence?: number;
  proofread?: boolean;
  bbox?: number[];
  type?: string;
  reading_order?: number;
  originalIndex?: number;
};

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
    const pageNum = segment.start + 1;
    const segmentWithIndex = { ...segment, originalIndex: index };

    if (!pageMap.has(pageNum)) {
      pageMap.set(pageNum, []);
    }
    pageMap.get(pageNum)!.push(segmentWithIndex);
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
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [submittedPages, setSubmittedPages] = useState<Record<number, boolean>>(
    {},
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

  const { value, suggestions, inputProps, setValue } = useTeluguTyping();
  const [isTeluguTypingEnabled, setIsTeluguTypingEnabled] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const saveCurrentPageText = () => {
    if (isTeluguTypingEnabled && value !== undefined && value !== null) {
      setSegmentsByPage((prevMap) => {
        const newMap = new Map(prevMap);
        const pageSegments = newMap.get(pageNumber);
        if (pageSegments && currentSegmentIndex < pageSegments.length) {
          const updatedSegments = [...pageSegments];
          updatedSegments[currentSegmentIndex] = {
            ...updatedSegments[currentSegmentIndex],
            text: value,
          };
          newMap.set(pageNumber, updatedSegments);
        }
        return newMap;
      });
    }
  };

  useEffect(() => {
    if (isTeluguTypingEnabled) {
      const pageSegments = segmentsByPage.get(pageNumber) || [];
      const currentSegmentText = pageSegments[currentSegmentIndex]?.text || '';
      if (value !== currentSegmentText) {
        setValue(currentSegmentText);
      }
    }
  }, [
    segmentsByPage,
    pageNumber,
    currentSegmentIndex,
    setValue,
    isTeluguTypingEnabled,
    value,
  ]);

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
      }
      return newMap;
    });
  };

  // Reset header timeout ref on unmount to avoid memory leaks
  useEffect(() => {
    const timeoutRef = headerTimeoutRef;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentPageSegments = getCurrentPageSegments();

  // Compute the reference dimensions for bbox overlay positioning.
  // Uses inferred OCR image dimensions when bbox coords are in pixel space,
  // otherwise falls back to the PDF page dimensions.
  const ocrRefDimensions = useMemo(() => {
    const inferred = getOcrReferenceDimensions(currentPageSegments);
    if (inferred) return inferred;
    return pdfPageSize;
  }, [currentPageSegments, pdfPageSize]);

  const navigateToPage = (pageNum: number) => {
    saveCurrentPageText();
    setPageNumber(pageNum);
  };

  async function fetchRecordById(recordId: string) {
    saveCurrentPageText();

    setIsLoading(true);
    setError(null);
    setBookData(null);
    setRecordId(null);
    setFullRecordData(null);
    setPageNumber(1);
    setCurrentSegmentIndex(0);
    setSegmentsByPage(new Map());
    setSubmittedPages({});
    setNumPages(0);

    const token = localStorage.getItem('token');
    try {
      const [recordDetailsResponse, recordUrlResponse, recordTextResponse] =
        await Promise.all([
          fetch(`${BACKEND_URL}/records/${recordId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/records/${recordId}/record-url`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/records/${recordId}/text`, {
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
        throw new Error(
          `Failed to fetch record URL. Status: ${recordUrlResponse.status}`,
        );
      }

      const recordDetails =
        (await recordDetailsResponse.json()) as RecordDetails;
      const urlData = await recordUrlResponse.json();
      const recordTextData = recordTextResponse.ok
        ? ((await recordTextResponse.json()) as ExtractedTextResponse)
        : null;

      setFullRecordData(recordDetails);
      setRecordId(recordId);

      const pdfUrl =
        urlData.url || urlData.signedUrl || urlData.record_url || urlData.link;

      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
        throw new Error('Could not find a valid URL in the API response.');
      }

      const segments =
        recordTextData?.segments ||
        recordDetails.extracted_text?.segments ||
        [];

      if (segments.length === 0) {
        throw new Error('No segments found in the record.');
      }

      const groupedSegments = groupSegmentsByPage(segments);
      const totalPages =
        segments.length > 0 ? Math.max(...segments.map((s) => s.start + 1)) : 0;

      const initialSubmittedPages: Record<number, boolean> = {};
      segments.forEach((segment) => {
        const pageNum = segment.start + 1;
        if (segment.proofread) {
          initialSubmittedPages[pageNum] = true;
        }
      });

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
      setSubmittedPages(initialSubmittedPages);
      setNumPages(totalPages);
      setPdfPageSize({ width: 0, height: 0 });
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
    saveCurrentPageText();

    setIsLoading(true);
    setError(null);
    setBookData(null);
    setRecordId(null);
    setFullRecordData(null);
    setPageNumber(1);
    setCurrentSegmentIndex(0);
    setSegmentsByPage(new Map());
    setSubmittedPages({});
    setNumPages(0);

    const token = localStorage.getItem('token');
    try {
      const nextRecordResponse = await fetch(
        `${BACKEND_URL}/records/next-for-review`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (nextRecordResponse.status === 404) {
        throw new Error('No new records are available for proofreading.');
      }
      if (!nextRecordResponse.ok) {
        const errorData = await nextRecordResponse.json();
        throw new Error(errorData.message || 'Failed to find the next record.');
      }

      const responseArray = await nextRecordResponse.json();
      if (!Array.isArray(responseArray) || responseArray.length === 0) {
        throw new Error(
          'Invalid response format from /next-for-review - expected an array with at least one record',
        );
      }
      const { record_id } = responseArray[0];
      setRecordId(record_id);

      const [recordDetailsResponse, recordUrlResponse, recordTextResponse] =
        await Promise.all([
          fetch(`${BACKEND_URL}/records/${record_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/records/${record_id}/record-url`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${BACKEND_URL}/records/${record_id}/text`, {
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
      const recordTextData = recordTextResponse.ok
        ? ((await recordTextResponse.json()) as ExtractedTextResponse)
        : null;

      setFullRecordData(recordDetails);

      const pdfUrl =
        urlData.url || urlData.signedUrl || urlData.record_url || urlData.link;

      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
        throw new Error('Could not find a valid URL in the API response.');
      }

      const segments =
        recordTextData?.segments ||
        recordDetails.extracted_text?.segments ||
        [];

      if (segments.length === 0) {
        throw new Error('No segments found in the record.');
      }

      const groupedSegments = groupSegmentsByPage(segments);
      const totalPages =
        segments.length > 0 ? Math.max(...segments.map((s) => s.start + 1)) : 0;

      const initialSubmittedPages: Record<number, boolean> = {};
      segments.forEach((segment) => {
        const pageNum = segment.start + 1;
        if (segment.proofread) {
          initialSubmittedPages[pageNum] = true;
        }
      });

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
      setSubmittedPages(initialSubmittedPages);
      setNumPages(totalPages);
      setPdfPageSize({ width: 0, height: 0 });
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
      alert('Cannot submit: No record is currently loaded.');
      return;
    }
    saveCurrentPageText();
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');

    const allSegments: Segment[] = [];
    segmentsByPage.forEach((pageSegments) => {
      allSegments.push(...pageSegments);
    });
    allSegments.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      if (a.reading_order !== undefined && b.reading_order !== undefined) {
        return a.reading_order - b.reading_order;
      }
      return (a.originalIndex || 0) - (b.originalIndex || 0);
    });

    const updatedSegments = allSegments.map((segment) => {
      const pageNum = segment.start + 1;
      const wasAlreadySubmitted = !!submittedPages[pageNum];
      const isCurrentPage = pageNum === pageNumber;

      return {
        start: segment.start,
        end: segment.end,
        text: segment.text.trim() === '' ? ' ' : segment.text,
        proofread: wasAlreadySubmitted || isCurrentPage || !!segment.proofread,
        bbox: segment.bbox,
        type: segment.type,
        reading_order: segment.reading_order,
        confidence: segment.confidence,
      };
    });

    const requestBody = {
      transcription: fullRecordData.extracted_text?.transcription || '',
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

      alert(`Page ${pageNumber} submitted successfully!`);
      setSubmittedPages((prev) => ({ ...prev, [pageNumber]: true }));

      if (numPages && pageNumber < numPages) {
        navigateToPage(pageNumber + 1);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* --- Header --- */}
      <div
        className={`gradient-purple text-white p-4 rounded-b-3xl shadow-xl transition-all duration-300 ${typeof window !== 'undefined' && isHeaderCollapsed && window.innerWidth < 768 ? 'pb-2' : ''}`}
      >
        {/* Main header content - hidden when collapsed on mobile */}
        <div
          className={`${typeof window !== 'undefined' && isHeaderCollapsed && window.innerWidth < 768 ? 'hidden' : ''} flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                window.location.href = '/tools';
              }}
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {t('common.docDigitization.tool')}
              </h1>
              <p className="text-purple-100 text-sm">
                {t('common.reviewAndCorrectOcrTextFromDocuments')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <form
              onSubmit={handleSearchRecord}
              className="flex gap-2 w-full sm:w-auto"
            >
              <input
                type="text"
                value={searchRecordId}
                onChange={(e) => setSearchRecordId(e.target.value)}
                placeholder={t('media.enterRecordId')}
                className="px-3 py-2 rounded text-gray-900 text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-purple-300"
                disabled={isSearching || isLoading}
              />
              <button
                type="submit"
                className="bg-white text-purple-700 hover:bg-purple-100 font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 whitespace-nowrap"
                disabled={isSearching || isLoading || !searchRecordId.trim()}
              >
                {isSearching ? t('common.loading') : 'Search'}
              </button>
            </form>
            <button
              className="bg-white text-purple-700 hover:bg-purple-100 font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto"
              onClick={fetchNextRecord}
              disabled={isLoading || isSearching}
            >
              {isLoading
                ? t('common.loading')
                : t('proofreading.getNextRecord')}
            </button>
          </div>
        </div>

        {/* Mobile: Page Numbers - hidden when header is collapsed */}
        <div
          className={`${typeof window !== 'undefined' && isHeaderCollapsed && window.innerWidth < 768 ? 'hidden' : ''} w-full mt-2 p-2 border-t border-white/30 md:hidden`}
        >
          {error && (
            <p className="text-red-200 text-sm mt-2 p-2 bg-red-900/50 rounded w-full mb-2 text-center">
              {error}
            </p>
          )}

          {bookData && (
            <>
              <h3 className="text-sm font-bold mb-2 text-center">
                {t('proofreading.page')} {pageNumber}
              </h3>
              <div className="w-full overflow-x-auto overflow-y-visible flex flex-row items-center justify-start gap-1 pb-2 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                {Array.from(new Array(numPages || 0), (el, index) => {
                  const currentPage = index + 1;
                  const isSubmitted = submittedPages[currentPage];
                  const isActive = pageNumber === currentPage;

                  const buttonClasses = [
                    'w-9',
                    'h-9',
                    'text-center',
                    'text-xs',
                    'p-1',
                    'mx-0.5',
                    'rounded-md',
                    'transition-colors',
                    'duration-150',
                    'font-semibold',
                  ];

                  if (isSubmitted) {
                    buttonClasses.push(
                      'bg-yellow-500',
                      'dark:bg-yellow-600',
                      'text-white',
                    );
                  } else {
                    buttonClasses.push(
                      'bg-white',
                      'dark:bg-gray-700',
                      'text-gray-900',
                      'dark:text-gray-100',
                      'hover:bg-gray-200',
                      'dark:hover:bg-gray-600',
                    );
                  }

                  if (isActive) {
                    buttonClasses.push(
                      'ring-2',
                      'ring-offset-2',
                      'ring-blue-500',
                      'dark:ring-offset-gray-900',
                    );
                  }

                  return (
                    <button
                      key={`page_button_${currentPage}`}
                      onClick={() => navigateToPage(currentPage)}
                      className={buttonClasses.join(' ')}
                    >
                      {currentPage}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Mobile: Header toggle with chevrons - below page numbers */}
        <div className="flex justify-center items-center md:hidden">
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="text-white flex items-center gap-1 mt-1"
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto">
        {/* --- Mobile First: PDF Viewer at Top --- */}
        <div className="w-full p-3 border-b border-gray-300 dark:border-gray-700 md:hidden">
          {bookData ? (
            <>
              <div className="p-2 flex justify-center items-center bg-gray-200 dark:bg-gray-800 rounded-lg mb-2">
                <button
                  className="mx-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded text-sm"
                  onClick={() => setZoom((prev) => Math.max(0.2, prev - 0.2))}
                >
                  -
                </button>
                <span className="font-semibold mx-2">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="mx-1 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded text-sm"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                >
                  +
                </button>
              </div>
              <div className="flex justify-center min-h-[300px] p-2">
                <div
                  className="relative inline-block"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <div className="relative">
                    <Document
                      file={bookData.pdfUrl}
                      loading="Loading PDF..."
                      className="inline-block"
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    >
                      <Page
                        pageNumber={pageNumber}
                        scale={1}
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
                    {pdfPageSize.width > 0 && (
                      <div className="absolute inset-0 pointer-events-none">
                        {currentPageSegments.map((segment, idx) => {
                          const normalizedBox = normalizeBbox(segment.bbox);
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
                              key={`bbox_overlay_mobile_${idx}`}
                              className={`absolute border-2 transition-colors cursor-pointer pointer-events-auto ${colorClasses.box}`}
                              style={overlayStyle}
                              onClick={() => {
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
          <div className="flex flex-col items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold flex-shrink-0">
              Proofread OCR Text
            </h2>
            {currentPageSegments.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {pageNumber} - {currentPageSegments.length} segments
              </p>
            )}

            {hintsVisible && (
              <p className="text-sm text-center">
                {t('ui.start.typing.to.get.hints')}
              </p>
            )}

            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-center gap-1">
                <input
                  className="cursor-pointer"
                  id="telugu-toggle"
                  type="checkbox"
                  checked={isTeluguTypingEnabled}
                  onChange={() =>
                    setIsTeluguTypingEnabled(!isTeluguTypingEnabled)
                  }
                />
                <label className="cursor-pointer" htmlFor="telugu-toggle">
                  Telugu
                </label>
              </div>

              {isTeluguTypingEnabled && (
                <div className="flex items-center gap-1">
                  <input
                    id="telugu-hints-toggle"
                    type="checkbox"
                    checked={hintsVisible}
                    onChange={() => setHintsVisible(!hintsVisible)}
                  />
                  <label htmlFor="telugu-hints-toggle">
                    {t('common.showHints')}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Segments - Direct editing */}
          <div className="space-y-3">
            {currentPageSegments.map((segment, idx) => (
              <div
                key={`segment_edit_mobile_${idx}`}
                className="flex flex-col gap-1"
              >
                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-black/70 text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <AutoResizeTextArea
                  value={segment.text || ''}
                  onChange={(e) => handleSegmentChange(idx, e.target.value)}
                  placeholder={t('ui.ocr.text.will.appear.here')}
                  disabled={!bookData || isLoading || isSubmitting}
                />
              </div>
            ))}
          </div>

          {hintsVisible && <SuggestionBar suggestions={suggestions} />}
        </div>

        {/* --- Desktop: Side-by-side layout remains unchanged --- */}
        <div className="hidden md:flex md:flex-row w-full h-full overflow-hidden">
          {/* --- Left Sidebar --- */}
          <div className="w-20 flex-shrink-0 flex flex-col p-0 border-r border-gray-300 dark:border-gray-700">
            {error && (
              <p className="text-red-500 text-sm mt-2 p-2 bg-red-100 dark:bg-red-900 rounded">
                {error}
              </p>
            )}

            {bookData && (
              <>
                <h3 className="text-md font-bold mt-4 mb-2 text-center">
                  {t('proofreading.pages')}
                </h3>
                <div className="w-full flex-grow overflow-y-auto pr-2 flex flex-col items-center">
                  {Array.from(new Array(numPages || 0), (el, index) => {
                    const currentPage = index + 1;
                    const isSubmitted = submittedPages[currentPage];
                    const isActive = pageNumber === currentPage;

                    const buttonClasses = [
                      'w-1/2',
                      'text-center',
                      'p-1',
                      'my-1',
                      'rounded-md',
                      'transition-colors',
                      'duration-150',
                      'font-semibold',
                    ];

                    if (isSubmitted) {
                      buttonClasses.push(
                        'bg-yellow-500',
                        'dark:bg-yellow-600',
                        'text-white',
                      );
                    } else {
                      buttonClasses.push(
                        'bg-white',
                        'dark:bg-gray-700',
                        'text-gray-900',
                        'dark:text-gray-100',
                        'hover:bg-gray-200',
                        'dark:hover:bg-gray-600',
                      );
                    }

                    if (isActive) {
                      buttonClasses.push(
                        'ring-2',
                        'ring-offset-2',
                        'ring-blue-500',
                        'dark:ring-offset-gray-900',
                      );
                    }

                    return (
                      <button
                        key={`page_button_${currentPage}`}
                        onClick={() => navigateToPage(currentPage)}
                        className={buttonClasses.join(' ')}
                      >
                        {currentPage}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* --- Main Content --- */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              {/* PDF Viewer */}
              <div className="w-1/2 flex flex-col p-5 overflow-y-auto border-r border-gray-300 dark:border-gray-700">
                {bookData ? (
                  <>
                    <div className="flex-shrink-0 flex justify-center items-center mb-4 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                      <button
                        className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                        onClick={() =>
                          setZoom((prev) => Math.max(0.2, prev - 0.2))
                        }
                      >
                        -
                      </button>
                      <span className="font-semibold">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                        onClick={() => setZoom((prev) => prev + 0.2)}
                      >
                        {t('common.')}
                      </button>
                    </div>
                    {/* PDF viewer with bounding box overlays */}
                    <div
                      ref={scrollContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeaveOrUp}
                      onMouseUp={handleMouseLeaveOrUp}
                      onMouseMove={handleMouseMove}
                      className="flex-grow flex flex-col items-center min-h-[300px] p-2 overflow-auto bg-gray-100 dark:bg-gray-900"
                    >
                      <div
                        className="relative inline-block"
                        style={{
                          transform: `scale(${zoom})`,
                          transformOrigin: 'top center',
                        }}
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
                              scale={1}
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
                          {pdfPageSize.width > 0 && (
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
                        Page {pageNumber} - {currentPageSegments.length} segment
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
                <div className="flex-grow overflow-y-auto space-y-4">
                  {currentPageSegments.length > 0 ? (
                    currentPageSegments.map((segment, idx) => (
                      <div
                        key={`segment_editor_${idx}`}
                        id={`segment_editor_${idx}`}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded bg-black/70 text-white text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {segment.type || 'Segment'}
                            {segment.bbox && segment.bbox.length >= 4 && (
                              <span className="ml-2">
                                [{segment.bbox[0]}, {segment.bbox[1]}]
                              </span>
                            )}
                          </span>
                        </div>
                        <AutoResizeTextArea
                          placeholder={t('common.editSegmentText')}
                          value={segment.text || ''}
                          onChange={(e) =>
                            handleSegmentChange(idx, e.target.value)
                          }
                          disabled={!bookData || isLoading || isSubmitting}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      {t('common.noSegmentsFoundForThisPage')}
                    </p>
                  )}
                </div>

                {hintsVisible && isTeluguTypingEnabled && (
                  <SuggestionBar suggestions={suggestions} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button Section */}
        <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:opacity-50"
            onClick={() => {
              saveCurrentPageText();
              setSubmittedPages((prev) => ({ ...prev, [pageNumber]: true }));
              if (numPages && pageNumber < numPages) {
                navigateToPage(pageNumber + 1);
              }
            }}
            disabled={isSubmitting}
          >
            {t('common.submitPage')}
          </button>
          <button
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
            onClick={handleSubmitPage}
            disabled={
              isSubmitting ||
              !numPages ||
              Object.keys(submittedPages).length < numPages
            }
          >
            {isSubmitting
              ? 'Submitting...'
              : Object.keys(submittedPages).length === numPages
                ? 'Submit Complete Record'
                : 'Submit all pages to enable'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DocDigitization;
