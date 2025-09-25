import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Mock JSON response for the book data.
const mockBook = {
  pdfUrl: 'https://sample.pdf',

  ocrText: [`sample ocr text`],
};

function Proofreading() {
  const [bookData, setBookData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [proofreadPages, setProofreadPages] = useState([]);
  const [ocrTexts, setOcrTexts] = useState([]);
  const [zoom, setZoom] = useState(1.0);

  function fetchBook() {
    setTimeout(() => {
      setBookData(mockBook);
      setOcrTexts(mockBook.ocrText);
    }, 500);
  }

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setProofreadPages(Array(numPages).fill(false));
    // Ensure ocrTexts array is long enough, filling with empty strings if needed
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

  function handleSubmit() {
    const newProofreadPages = [...proofreadPages];
    newProofreadPages[pageNumber - 1] = true;
    setProofreadPages(newProofreadPages);
    alert(`Submitting proofread text for page ${pageNumber}`);
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 pt-16">
      {/* --- Left Sidebar (Book Info & Page Navigation) --- */}
      <div className="w-64 flex-shrink-0 flex flex-col p-4 border-r border-gray-300 dark:border-gray-700">
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:opacity-50"
          onClick={fetchBook}
          disabled={!!bookData}
        >
          {bookData ? 'Book Loaded' : 'Fetch Book'}
        </button>

        {bookData && (
          <>
            {/* Book Identification Preview (First Page) */}
            <div className="mt-4 p-2 border border-gray-400 rounded-md">
              <h3 className="text-md font-bold mb-2 text-center">
                Book Preview
              </h3>
              <Document file={bookData.pdfUrl} loading=" ">
                <Page
                  pageNumber={1}
                  width={200}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>

            {/* Scrollable Page List */}
            <h3 className="text-md font-bold mt-4 mb-2 text-center">Pages</h3>
            <div className="flex-grow overflow-y-auto pr-2">
              {Array.from(new Array(numPages || 0), (el, index) => (
                <button
                  key={`page_button_${index + 1}`}
                  onClick={() => setPageNumber(index + 1)}
                  className={`w-full text-left p-2 my-1 rounded-md transition-colors duration-150 ${
                    proofreadPages[index]
                      ? 'bg-green-700 hover:bg-green-600'
                      : 'bg-red-700 hover:bg-red-600'
                  } ${pageNumber === index + 1 ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-blue-400' : ''}`}
                >
                  Page {index + 1}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* --- Main Content (PDF Viewer & OCR Editor) --- */}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* PDF Viewer Panel */}
        <div className="flex-1 flex flex-col p-5 overflow-y-auto">
          {bookData ? (
            <>
              <div className="flex-shrink-0 flex justify-center items-center mb-4 p-2 bg-gray-200 dark:bg-gray-800 rounded-lg">
                <button
                  className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                  onClick={() =>
                    setZoom((prevZoom) => Math.max(0.2, prevZoom - 0.2))
                  }
                >
                  Zoom Out
                </button>
                <span className="font-semibold">{Math.round(zoom * 100)}%</span>
                <button
                  className="mx-2.5 px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded"
                  onClick={() => setZoom((prevZoom) => prevZoom + 0.2)}
                >
                  Zoom In
                </button>
              </div>
              <div className="flex-grow flex justify-center">
                <Document
                  file={bookData.pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading="Loading PDF document..."
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
                  className="mx-2.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  onClick={handleSubmit}
                >
                  Submit Page
                </button>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-full">
              <p className="text-xl">
                Please fetch a book to begin proofreading.
              </p>
            </div>
          )}
        </div>

        {/* OCR Text Editor Panel */}
        <div className="flex-1 flex flex-col p-5 border-l border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-3 flex-shrink-0">
            Proofread OCR Text
          </h2>
          <textarea
            className="flex-grow w-full resize-none border border-gray-300 dark:border-gray-600 p-2.5 rounded bg-gray-50 dark:bg-gray-800"
            placeholder="OCR extracted text will appear here."
            value={bookData ? ocrTexts[pageNumber - 1] || '' : ''}
            onChange={handleOcrTextChange}
            disabled={!bookData}
          ></textarea>
        </div>
      </div>
    </div>
  );
}

export default Proofreading;
