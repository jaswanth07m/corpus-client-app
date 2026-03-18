import { SuggestionBar } from '@/components/SuggestionBar';
import { useTeluguTyping } from '@/hooks/useTeluguTyping';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// The backend URL from the API documentation
import { BACKEND_URL } from '@/lib/constants';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function DocDigitization() {
  const { t } = useTranslation();
  const [bookData, setBookData] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [fullRecordData, setFullRecordData] = useState(null); // State to hold the original record
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [ocrTexts, setOcrTexts] = useState([]);
  const [submittedPages, setSubmittedPages] = useState({});
  const [zoom, setZoom] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { value, suggestions, inputProps, setValue } = useTeluguTyping();
  const [isTeluguTypingEnabled, setIsTeluguTypingEnabled] = useState(false);
  const [hintsVisible, setHintsVisible] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Get initial click position and current scroll position
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setStartY(e.pageY - scrollContainerRef.current.offsetTop);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    setScrollTop(scrollContainerRef.current.scrollTop);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();

    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const y = e.pageY - scrollContainerRef.current.offsetTop;

    // Calculate distance moved
    const walkX = x - startX;
    const walkY = y - startY;

    // Update scroll position
    scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
    scrollContainerRef.current.scrollTop = scrollTop - walkY;
  };

  // Function to save the current page's text before navigating away
  const saveCurrentPageText = () => {
    if (isTeluguTypingEnabled && value !== undefined && value !== null) {
      // When using telugu typing, save the current value to the current page's position
      const newOcrTexts = [...ocrTexts];
      newOcrTexts[pageNumber - 1] = value;
      setOcrTexts(newOcrTexts);
    }
    // For non-telugu typing, handleOcrTextChange should keep ocrTexts updated as user types
  };

  useEffect(() => {
    if (isTeluguTypingEnabled) {
      const currentPageText = ocrTexts[pageNumber - 1] || '';
      if (value !== currentPageText) {
        setValue(currentPageText);
      }
    }
  }, [ocrTexts, pageNumber, setValue, isTeluguTypingEnabled, value]);

  const handleTextChange = (newValue) => {
    // 1. Update the local input state immediately for responsiveness
    setValue(newValue);

    // 2. Update the main ocrTexts state array
    if (isTeluguTypingEnabled) {
      const newOcrTexts = [...ocrTexts];
      newOcrTexts[pageNumber - 1] = newValue;
      setOcrTexts(newOcrTexts);
    }
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

  // Update the textAreaProps to ensure changes are properly saved
  const textAreaProps = isTeluguTypingEnabled
    ? {
        ...inputProps,
        value: value,
        onChange: (e) => {
          // Update the hook's value
          const newValue = e.target.value;
          setValue(newValue);
          // Also update the ocrTexts state to persist the changes
          const newOcrTexts = [...ocrTexts];
          newOcrTexts[pageNumber - 1] = newValue;
          setOcrTexts(newOcrTexts);
        },
      }
    : {
        value: ocrTexts[pageNumber - 1] || '',
        onChange: handleOcrTextChange,
      };

  async function fetchNextRecord() {
    // Save current page's text before loading new record
    saveCurrentPageText();

    setIsLoading(true);
    setError(null);
    setBookData(null);
    setRecordId(null);
    setFullRecordData(null); // Reset full record data
    setPageNumber(1);
    setOcrTexts([]);
    setSubmittedPages({});

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
      const { record_id } = responseArray[0]; // Get the first record from the array
      console.log('Fetched Record ID:', record_id);
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

      const recordDetails = await recordDetailsResponse.json();
      const urlData = await recordUrlResponse.json();

      setFullRecordData(recordDetails); // Store the entire original record
      console.log('Raw response from /records/{id}:', recordDetails);

      const pdfUrl =
        urlData.url || urlData.signedUrl || urlData.record_url || urlData.link;

      if (!pdfUrl || typeof pdfUrl !== 'string' || pdfUrl.trim() === '') {
        throw new Error('Could not find a valid URL in the API response.');
      }

      console.log('Successfully retrieved PDF URL:', pdfUrl);

      const segments = recordDetails.extracted_text?.segments || [];
      const initialOcrTexts = segments.map((segment) => segment.text || '');
      const initialSubmittedPages = {};
      segments.forEach((segment, index) => {
        if (segment.proofread) {
          initialSubmittedPages[index + 1] = true;
        }
      });

      setBookData({
        pdfUrl: pdfUrl,
        metadata: {
          title: recordDetails.title,
          language: recordDetails.language,
          author: recordDetails.author,
          source: recordDetails.source,
        },
      });
      setOcrTexts(initialOcrTexts);
      setSubmittedPages(initialSubmittedPages);
    } catch (err) {
      const error = err as Error;
      console.error('An error occurred in fetchNextRecord:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    if (ocrTexts.length < numPages) {
      const newOcrTexts = [...ocrTexts];
      for (let i = ocrTexts.length; i < numPages; i++) {
        newOcrTexts.push(`OCR Text for Page ${i + 1} not available.`);
      }
      setOcrTexts(newOcrTexts);
    }
  }

  function handleOcrTextChange(e) {
    const newOcrTexts = [...ocrTexts];
    newOcrTexts[pageNumber - 1] = e.target.value;
    setOcrTexts(newOcrTexts);
  }

  async function handleSubmitPage() {
    if (!recordId || !fullRecordData) {
      alert('Cannot submit: No record is currently loaded.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');

    // 1. Fix the empty string issue
    const updatedSegments = ocrTexts.map((text, index) => {
      const currentPage = index + 1;
      const isCurrentPage = currentPage === pageNumber;
      const wasAlreadySubmitted = !!submittedPages[currentPage];

      return {
        // If text is empty, send a single space. Otherwise, send the text.
        text: text.trim() === '' ? ' ' : text,
        proofread: wasAlreadySubmitted || isCurrentPage,
      };
    });

    // 2. Construct the full, correct request body
    const requestBody = {
      // Use original values from the fetched record, falling back to defaults
      transcription: fullRecordData.extracted_text?.transcription || '',
      extraction_type: fullRecordData.extracted_text?.extraction_type || 'OCR',
      segments: updatedSegments,
    };

    console.log('Submitting PATCH request with body:', requestBody);

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
        // Log the detailed error from the API for easier debugging
        console.error('API Submission Error:', errorData);
        throw new Error(
          errorData.detail?.[0]?.msg ||
            'Failed to submit the proofread update.',
        );
      }

      alert(`Page ${pageNumber} submitted successfully!`);
      // Save current page's text before marking as submitted
      saveCurrentPageText();
      setSubmittedPages((prev) => ({ ...prev, [pageNumber]: true }));

      if (numPages && pageNumber < numPages) {
        setPageNumber(pageNumber + 1);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }
  // --- END: FULLY CORRECTED SUBMISSION LOGIC ---

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

          <button
            className="bg-white text-purple-700 hover:bg-purple-100 font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto"
            onClick={fetchNextRecord}
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : t('proofreading.getNextRecord')}
          </button>
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
                      onClick={() => {
                        saveCurrentPageText();
                        setPageNumber(currentPage);
                      }}
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
                <Document
                  file={bookData.pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Loading PDF..."
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={
                      typeof window !== 'undefined' && window.innerWidth < 768
                        ? zoom * 1.3
                        : zoom
                    }
                    width={
                      typeof window !== 'undefined' && window.innerWidth < 768
                        ? Math.min(window.innerWidth * 0.9, 600)
                        : undefined
                    }
                  />
                </Document>
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

        {/* --- Mobile: OCR Text Editor in Middle --- */}
        <div className="w-full p-3 border-b border-gray-300 dark:border-gray-700 md:hidden">
          <div className="flex flex-col items-center justify-between gap-2 mb-3">
            <h2 className="text-xl font-bold flex-shrink-0">
              Proofread OCR Text
            </h2>

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

          <textarea
            className="w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800 min-h-[200px] max-h-60"
            placeholder={t('ui.ocr.text.will.appear.here')}
            disabled={!bookData || isLoading || isSubmitting}
            {...textAreaProps}
          ></textarea>
          {hintsVisible && (
            <SuggestionBar suggestions={suggestions} className="mt-2" />
          )}
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
                        onClick={() => {
                          saveCurrentPageText();
                          setPageNumber(currentPage);
                        }}
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
                    {/* Added overflow-x-auto to ensure horizontal scrolling is possible */}
                    <div
                      ref={scrollContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseLeave={handleMouseLeaveOrUp}
                      onMouseUp={handleMouseLeaveOrUp}
                      onMouseMove={handleMouseMove}
                      className="flex-grow flex flex-col items-center min-h-[300px] p-2 overflow-auto bg-gray-100 dark:bg-gray-900"
                    >
                      <Document
                        file={bookData.pdfUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={t('proofreading.loadingPdf')}
                        className="mx-auto"
                      >
                        <Page
                          pageNumber={pageNumber}
                          scale={zoom}
                          renderAnnotationLayer={false}
                          renderTextLayer={true}
                        />
                      </Document>
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

              {/* OCR Text Editor */}
              <div className="w-1/2 flex flex-col p-5 relative">
                <div className="flex flex-row justify-between">
                  <h2 className="text-xl font-bold mb-3 flex-shrink-0">
                    {t('common.proofread.ocr.text')}
                  </h2>

                  {hintsVisible && (
                    <p className="text-sm">
                      {t('ui.start.typing.to.get.hints')}
                    </p>
                  )}

                  <div>
                    <div className="flex gap-1">
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
                        {t('languages.telugu')}
                      </label>
                    </div>

                    {isTeluguTypingEnabled && (
                      <div className="flex gap-1">
                        <input
                          id="telugu-hints-toggle"
                          type="checkbox"
                          checked={hintsVisible}
                          onChange={() => setHintsVisible(!hintsVisible)}
                        />
                        <label htmlFor="telugu-hints-toggle">Show Hints</label>
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  className="flex-grow w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800"
                  placeholder="OCR text will appear here."
                  disabled={!bookData || isLoading || isSubmitting}
                  {...textAreaProps}
                ></textarea>
                {hintsVisible && <SuggestionBar suggestions={suggestions} />}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button Section */}
        <div className="border-t border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col sm:flex-row justify-center gap-4">
          <button
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded disabled:opacity-50"
            onClick={() => {
              // Save current page's text
              saveCurrentPageText();
              // Mark current page as submitted locally and move to next page
              setSubmittedPages((prev) => ({ ...prev, [pageNumber]: true }));
              if (numPages && pageNumber < numPages) {
                setPageNumber(pageNumber + 1);
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
