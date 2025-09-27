import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// The backend URL from the API documentation
const BACKEND_URL = 'https://dev.api.corpus.swecha.org/api/v1';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function Proofreading() {
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

  async function fetchNextRecord() {
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

      const { record_id } = await nextRecordResponse.json();
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

  // --- START: FULLY CORRECTED SUBMISSION LOGIC ---
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
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-16">
      {/* --- Left Sidebar --- */}
      <div className="w-64 flex-shrink-0 flex flex-col p-4 border-r border-gray-300 dark:border-gray-700">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
          onClick={fetchNextRecord}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Get Next Record'}
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-2 p-2 bg-red-100 dark:bg-red-900 rounded">
            {error}
          </p>
        )}

        {bookData && (
          <>
            <div className="mt-4 p-3 border border-gray-400 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
              <h3 className="text-md font-bold mb-2 text-center border-b pb-2 dark:border-gray-600">
                Record Metadata
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Title:</strong> {bookData.metadata.title || 'N/A'}
                </p>
                <p>
                  <strong>Language:</strong>{' '}
                  {bookData.metadata.language || 'N/A'}
                </p>
                <p>
                  <strong>Author:</strong> {bookData.metadata.author || 'N/A'}
                </p>
                <p>
                  <strong>Source:</strong> {bookData.metadata.source || 'N/A'}
                </p>
              </div>
            </div>

            <h3 className="text-md font-bold mt-4 mb-2 text-center">Pages</h3>
            <div className="flex-grow overflow-y-auto pr-2">
              {Array.from(new Array(numPages || 0), (el, index) => {
                const currentPage = index + 1;
                const isSubmitted = submittedPages[currentPage];
                const isActive = pageNumber === currentPage;

                const buttonClasses = [
                  'w-full',
                  'text-left',
                  'p-2',
                  'my-1',
                  'rounded-md',
                  'transition-colors',
                  'duration-150',
                  'font-semibold',
                ];

                if (isSubmitted) {
                  buttonClasses.push(
                    'bg-green-500',
                    'dark:bg-green-600',
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
                    onClick={() => setPageNumber(currentPage)}
                    className={buttonClasses.join(' ')}
                  >
                    Page {currentPage}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          {bookData ? (
            <>
              <div className="flex-shrink-0 flex justify-center items-center mb-4 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                <button
                  className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                  onClick={() => setZoom((prev) => Math.max(0.2, prev - 0.2))}
                >
                  -
                </button>
                <span className="font-semibold">{Math.round(zoom * 100)}%</span>
                <button
                  className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                  onClick={() => setZoom((prev) => prev + 0.2)}
                >
                  +
                </button>
              </div>
              <div className="flex-grow flex justify-center">
                <Document
                  file={bookData.pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Loading PDF..."
                >
                  <Page pageNumber={pageNumber} scale={zoom} />
                </Document>
              </div>
              <div className="flex-shrink-0 flex justify-center items-center mt-4">
                <button
                  className="mx-2.5 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                  onClick={() => setPageNumber(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                >
                  Previous
                </button>
                <span className="font-bold">
                  Page {pageNumber} of {numPages}
                </span>
                <button
                  className="mx-2.5 px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded disabled:opacity-50"
                  onClick={() => setPageNumber(pageNumber + 1)}
                  disabled={!numPages || pageNumber >= numPages}
                >
                  Next
                </button>
                <button
                  className="mx-2.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50"
                  onClick={handleSubmitPage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Page'}
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-xl">
                {isLoading
                  ? 'Fetching record...'
                  : 'Please get a record to begin.'}
              </p>
            </div>
          )}
        </div>

        {/* OCR Text Editor */}
        <div className="flex-1 flex flex-col p-5 border-l border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-3 flex-shrink-0">
            Proofread OCR Text
          </h2>
          <textarea
            className="flex-grow w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800"
            placeholder="OCR text will appear here."
            value={ocrTexts[pageNumber - 1] || ''}
            onChange={handleOcrTextChange}
            disabled={!bookData || isLoading || isSubmitting}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default Proofreading;
