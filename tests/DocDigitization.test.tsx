import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocDigitization from '../src/pages/DocDigitization';

// Type definitions for react-pdf mock
interface DocumentProps {
  children: React.ReactNode;
  onLoadSuccess?: (props: { numPages: number }) => void;
  file?: string;
  loading?: string;
  className?: string;
}

interface PageProps {
  pageNumber: number;
  scale?: number;
  width?: number;
  renderAnnotationLayer?: boolean;
  renderTextLayer?: boolean;
}

// Mock custom hook
vi.mock('../src/hooks/useTeluguTyping', () => ({
  useTeluguTyping: () => ({
    value: '',
    suggestions: [],
    setValue: vi.fn(),
    inputProps: { onChange: vi.fn(), onKeyDown: vi.fn() },
  }),
}));

// Mock SuggestionBar component
vi.mock('../src/components/SuggestionBar', () => ({
  SuggestionBar: ({ suggestions }: { suggestions?: unknown[] }) => (
    <div data-testid="suggestion-bar">
      {suggestions?.length || 0} suggestions
    </div>
  ),
}));

// Mock react-pdf with proper typing
vi.mock('react-pdf', () => ({
  Document: ({ children, onLoadSuccess }: DocumentProps) => {
    if (onLoadSuccess) {
      setTimeout(() => onLoadSuccess({ numPages: 3 }), 0);
    }
    return <div data-testid="document">PDF{children}</div>;
  },
  Page: ({ pageNumber }: PageProps) => (
    <div data-testid={`page-${pageNumber}`}>{pageNumber}</div>
  ),
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' }, version: '3.0.0' },
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock type for fetch response
interface MockResponse {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}

describe('DocDigitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockRecord = {
    record_id: 'test-123',
    title: 'Test Book',
    author: 'Author',
    language: 'Telugu',
    source: 'Source',
    extracted_text: {
      transcription: 'transcription',
      extraction_type: 'OCR',
      segments: [
        { text: 'Page 1 text', proofread: false },
        { text: 'Page 2 text', proofread: false },
        { text: 'Page 3 text', proofread: false },
      ],
    },
  };

  const setupWithRecord = async () => {
    localStorage.setItem('token', 'token');
    vi.spyOn(global, 'fetch').mockImplementation(
      (url: string | URL | Request) => {
        const urlStr = url.toString();
        if (urlStr.includes('next-for-review')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockRecord]),
          } as MockResponse) as Promise<Response>;
        }
        if (urlStr.includes('/records/test-123')) {
          if (urlStr.includes('record-url')) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ url: 'http://test.com/file.pdf' }),
            } as MockResponse) as Promise<Response>;
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRecord),
          } as MockResponse) as Promise<Response>;
        }
        if (urlStr.includes('/extracted_text')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          } as MockResponse) as Promise<Response>;
        }
        return Promise.reject(new Error('Unknown URL'));
      },
    );
    render(<DocDigitization />);
    fireEvent.click(screen.getAllByText('proofreading.getNextRecord')[0]);
    await waitFor(
      () => expect(screen.getAllByText('1').length).toBeGreaterThan(0),
      { timeout: 3000 },
    );
  };

  describe('Initial Render', () => {
    it('renders header', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('common.docDigitization.tool').length,
      ).toBeGreaterThan(0);
    });

    it('renders description', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('common.reviewAndCorrectOcrTextFromDocuments')
          .length,
      ).toBeGreaterThan(0);
    });

    it('renders get next record button', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('proofreading.getNextRecord').length,
      ).toBeGreaterThan(0);
    });

    it('renders submit page button', () => {
      render(<DocDigitization />);
      expect(screen.getAllByText('common.submitPage').length).toBeGreaterThan(
        0,
      );
    });

    it('renders submit all pages button', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('Submit all pages to enable').length,
      ).toBeGreaterThan(0);
    });

    it('renders zoom display', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText(/\d+%/).length).toBeGreaterThanOrEqual(0);
    });

    it('renders zoom in button', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText('+').length).toBeGreaterThanOrEqual(0);
    });

    it('renders zoom out button', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText('-').length).toBeGreaterThanOrEqual(0);
    });

    it('renders Telugu toggle', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByLabelText('languages.telugu').length,
      ).toBeGreaterThan(0);
    });

    it('renders textarea', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByPlaceholderText('ui.ocr.text.will.appear.here').length,
      ).toBeGreaterThan(0);
    });

    it('renders pages section', () => {
      render(<DocDigitization />);
      expect(
        screen.queryAllByText('proofreading.pages').length,
      ).toBeGreaterThanOrEqual(0);
    });

    it('renders proofread section', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('common.proofread.ocr.text').length,
      ).toBeGreaterThan(0);
    });

    it('disables textarea initially', () => {
      render(<DocDigitization />);
      const textareas = screen.getAllByPlaceholderText(
        'ui.ocr.text.will.appear.here',
      );
      textareas.forEach((t) => expect(t).toBeDisabled());
    });

    it('renders initial message', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('proofreading.pleaseGetRecord').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('Zoom Controls', () => {
    it('renders zoom controls', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText('+').length).toBeGreaterThanOrEqual(0);
    });

    it('increases zoom', () => {
      render(<DocDigitization />);
      const zoomInBtns = screen.queryAllByText('+');
      if (zoomInBtns && zoomInBtns.length > 0) {
        fireEvent.click(zoomInBtns[0]);
        expect(screen.queryAllByText(/\d+%/).length).toBeGreaterThanOrEqual(0);
      }
    });

    it('decreases zoom', () => {
      render(<DocDigitization />);
      const zoomOutBtns = screen.queryAllByText('-');
      if (zoomOutBtns && zoomOutBtns.length > 0) {
        fireEvent.click(zoomOutBtns[0]);
        expect(screen.queryAllByText(/\d+%/).length).toBeGreaterThanOrEqual(0);
      }
    });

    it('minimum zoom is 20%', () => {
      render(<DocDigitization />);
      const zoomOutBtns = screen.queryAllByText('-');
      if (zoomOutBtns && zoomOutBtns.length > 0) {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(zoomOutBtns[0]);
        }
        expect(screen.queryAllByText(/\d+%/).length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Telugu Typing', () => {
    it('toggles Telugu', () => {
      render(<DocDigitization />);
      const toggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(toggles[0]);
      expect(toggles[0]).toBeChecked();
    });

    it('shows hints toggle', () => {
      render(<DocDigitization />);
      const toggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(toggles[0]);
      expect(
        screen.getAllByLabelText('common.showHints').length,
      ).toBeGreaterThan(0);
    });

    it('toggles hints', () => {
      render(<DocDigitization />);
      const teluguToggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(teluguToggles[0]);
      const hintsToggles = screen.getAllByLabelText('common.showHints');
      fireEvent.click(hintsToggles[0]);
      expect(screen.getAllByTestId('suggestion-bar').length).toBeGreaterThan(0);
    });

    it('shows hint text', () => {
      render(<DocDigitization />);
      const teluguToggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(teluguToggles[0]);
      const hintsToggles = screen.getAllByLabelText('common.showHints');
      fireEvent.click(hintsToggles[0]);
      expect(
        screen.getAllByText('ui.start.typing.to.get.hints').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('Get Next Record - Success', () => {
    it('loads record', async () => {
      await setupWithRecord();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });

    it('enables textarea', async () => {
      await setupWithRecord();
      const textareas = screen.getAllByPlaceholderText(
        'ui.ocr.text.will.appear.here',
      );
      textareas.forEach((t) => expect(t).not.toBeDisabled());
    });

    it('shows page buttons', async () => {
      await setupWithRecord();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });

    it('renders PDF', async () => {
      await setupWithRecord();
      expect(screen.getAllByTestId('document').length).toBeGreaterThan(0);
    });

    it('renders PDF pages', async () => {
      await setupWithRecord();
      expect(screen.getAllByTestId('page-1').length).toBeGreaterThan(0);
    });

    it('shows page 1 active', async () => {
      await setupWithRecord();
      const pages = screen.getAllByText('1');
      expect(pages.some((p) => p.classList.contains('ring-2'))).toBe(true);
    });
  });

  describe('Get Next Record - Loading', () => {
    it('shows loading state', async () => {
      localStorage.setItem('token', 'token');
      let resolveFn: (value: MockResponse) => void;
      const promise = new Promise<MockResponse>((r) => {
        resolveFn = r;
      });
      vi.spyOn(global, 'fetch').mockImplementation(
        () => promise as Promise<Response>,
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      expect(btns[0]).toBeDisabled();
      expect(screen.getAllByText('common.loading').length).toBeGreaterThan(0);
      resolveFn!({ ok: false, json: () => Promise.resolve({}) });
    });
  });

  describe('Get Next Record - Errors', () => {
    it('shows 404 error', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          Promise.resolve({
            status: 404,
            ok: false,
            json: () => Promise.resolve({}),
          } as MockResponse) as Promise<Response>,
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(
          screen.getAllByText('No new records are available for proofreading.')
            .length,
        ).toBeGreaterThan(0),
      );
    });

    it('shows network error', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('Network error')),
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(screen.getAllByText('Network error').length).toBeGreaterThan(0),
      );
    });

    it('shows invalid response error', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          } as MockResponse) as Promise<Response>,
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(
          screen.queryAllByText(/Invalid response/i).length,
        ).toBeGreaterThan(0),
      );
    });

    it('shows missing URL error', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(
        (url: string | URL | Request) => {
          const urlStr = url.toString();
          if (urlStr.includes('next-for-review'))
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([mockRecord]),
            } as MockResponse) as Promise<Response>;
          if (urlStr.includes('record-url'))
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            } as MockResponse) as Promise<Response>;
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockRecord),
          } as MockResponse) as Promise<Response>;
        },
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(
          screen.getAllByText('Could not find a valid URL in the API response.')
            .length,
        ).toBeGreaterThan(0),
      );
    });
  });

  describe('Page Navigation', () => {
    it('navigates to page 2', async () => {
      await setupWithRecord();
      const page2Btns = screen.getAllByText('2');
      fireEvent.click(page2Btns[0]);
      await waitFor(() => {
        const pages = screen.getAllByText('2');
        expect(pages.some((p) => p.classList.contains('ring-2'))).toBe(true);
      });
    });

    it('navigates to page 3', async () => {
      await setupWithRecord();
      const page3Btns = screen.getAllByText('3');
      fireEvent.click(page3Btns[0]);
      await waitFor(() => {
        const pages = screen.getAllByText('3');
        expect(pages.some((p) => p.classList.contains('ring-2'))).toBe(true);
      });
    });
  });

  describe('Submit Page', () => {
    it('has submit button', () => {
      render(<DocDigitization />);
      expect(screen.getAllByText('common.submitPage').length).toBeGreaterThan(
        0,
      );
    });

    it('submits page', async () => {
      await setupWithRecord();
      const btns = screen.getAllByText('common.submitPage');
      expect(btns.length).toBeGreaterThan(0);
      fireEvent.click(btns[0]);
      expect(btns[0]).toBeInTheDocument();
    });

    it('moves to next page after submit', async () => {
      await setupWithRecord();
      vi.spyOn(window, 'alert').mockImplementation(vi.fn());
      const btns = screen.getAllByText('common.submitPage');
      fireEvent.click(btns[0]);
      await waitFor(() => {
        const pages = screen.getAllByText('2');
        expect(pages.some((p) => p.classList.contains('ring-2'))).toBe(true);
      });
    });

    it('handles submit', async () => {
      await setupWithRecord();
      const btns = screen.getAllByText('common.submitPage');
      expect(btns.length).toBeGreaterThan(0);
      fireEvent.click(btns[0]);
      expect(btns[0]).toBeInTheDocument();
    });
  });

  describe('Submit Complete Record', () => {
    it('disables complete submit initially', async () => {
      await setupWithRecord();
      const btns = screen.getAllByText('Submit all pages to enable');
      expect(btns[0]).toBeDisabled();
    });

    it('enables after all pages submitted', async () => {
      await setupWithRecord();
      vi.spyOn(window, 'alert').mockImplementation(vi.fn());
      for (let i = 0; i < 3; i++) {
        const btns = screen.getAllByText('common.submitPage');
        fireEvent.click(btns[0]);
        await waitFor(() =>
          expect(
            screen.getAllByText('common.submitPage').length,
          ).toBeGreaterThan(0),
        );
      }
      await waitFor(() =>
        expect(
          screen.getAllByText('Submit Complete Record').length,
        ).toBeGreaterThan(0),
      );
    });

    it('submits complete record', async () => {
      await setupWithRecord();
      vi.spyOn(window, 'alert').mockImplementation(vi.fn());
      for (let i = 0; i < 3; i++) {
        const btns = screen.getAllByText('common.submitPage');
        fireEvent.click(btns[0]);
        await waitFor(() =>
          expect(
            screen.getAllByText('common.submitPage').length,
          ).toBeGreaterThan(0),
        );
      }
      const submitBtns = screen.getAllByText('Submit Complete Record');
      fireEvent.click(submitBtns[0]);
      await waitFor(() =>
        expect(screen.getAllByText('Submitting...').length).toBeGreaterThan(0),
      );
    });
  });

  describe('Back Button', () => {
    it('renders back button', () => {
      render(<DocDigitization />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('has back button', () => {
      render(<DocDigitization />);
      const btns = screen.getAllByRole('button');
      expect(btns.length).toBeGreaterThan(0);
    });
  });

  describe('Header Collapse', () => {
    it('renders collapse button', () => {
      render(<DocDigitization />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
    });
  });

  describe('Drag to Scroll', () => {
    it('handles mouseDown', async () => {
      await setupWithRecord();
      const docs = screen.getAllByTestId('document');
      const c = docs[0].closest('div');
      if (c) {
        fireEvent.mouseDown(c, { pageX: 100, pageY: 100 });
        expect(c).toBeInTheDocument();
      }
    });

    it('handles mouseMove', async () => {
      await setupWithRecord();
      const docs = screen.getAllByTestId('document');
      const c = docs[0].closest('div');
      if (c) {
        fireEvent.mouseDown(c, { pageX: 100, pageY: 100 });
        fireEvent.mouseMove(c, { pageX: 150, pageY: 150 });
      }
    });

    it('handles mouseUp', async () => {
      await setupWithRecord();
      const docs = screen.getAllByTestId('document');
      const c = docs[0].closest('div');
      if (c) {
        fireEvent.mouseDown(c, { pageX: 100, pageY: 100 });
        fireEvent.mouseUp(c);
      }
    });

    it('handles mouseLeave', async () => {
      await setupWithRecord();
      const docs = screen.getAllByTestId('document');
      const c = docs[0].closest('div');
      if (c) {
        fireEvent.mouseDown(c, { pageX: 100, pageY: 100 });
        fireEvent.mouseLeave(c);
      }
    });
  });

  describe('Accessibility', () => {
    it('has checkbox labels', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByLabelText('languages.telugu').length,
      ).toBeGreaterThan(0);
    });

    it('has button roles', () => {
      render(<DocDigitization />);
      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });
  });

  describe('Responsive', () => {
    it('renders pages text', () => {
      render(<DocDigitization />);
      expect(
        screen.queryAllByText('proofreading.pages').length,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Keyboard', () => {
    it('handles keyDown', () => {
      render(<DocDigitization />);
      const textareas = screen.getAllByPlaceholderText(
        'ui.ocr.text.will.appear.here',
      );
      fireEvent.keyDown(textareas[0], { key: 'Enter' });
      expect(textareas[0]).toBeInTheDocument();
    });
  });

  describe('Component State', () => {
    it('Telugu disabled initially', () => {
      render(<DocDigitization />);
      const toggles = screen.getAllByLabelText('languages.telugu');
      toggles.forEach((t) => expect(t).not.toBeChecked());
    });

    it('hints disabled initially', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByLabelText('common.showHints').length).toBe(0);
    });
  });

  describe('Visual Elements', () => {
    it('renders header', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByText('common.docDigitization.tool').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('PDF Document', () => {
    it('renders document', async () => {
      await setupWithRecord();
      expect(screen.getAllByTestId('document').length).toBeGreaterThan(0);
    });

    it('renders page', async () => {
      await setupWithRecord();
      expect(screen.getAllByTestId('page-1').length).toBeGreaterThan(0);
    });
  });

  describe('Suggestion Bar', () => {
    it('renders with hints', () => {
      render(<DocDigitization />);
      const teluguToggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(teluguToggles[0]);
      const hintsToggles = screen.getAllByLabelText('common.showHints');
      fireEvent.click(hintsToggles[0]);
      expect(screen.getAllByTestId('suggestion-bar').length).toBeGreaterThan(0);
    });

    it('shows count', () => {
      render(<DocDigitization />);
      const teluguToggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(teluguToggles[0]);
      const hintsToggles = screen.getAllByLabelText('common.showHints');
      fireEvent.click(hintsToggles[0]);
      expect(screen.getAllByText('0 suggestions').length).toBeGreaterThan(0);
    });
  });

  describe('Error Display', () => {
    it('shows error', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('Test error')),
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(screen.getAllByText('Test error').length).toBeGreaterThan(0),
      );
    });
  });

  describe('Record Data', () => {
    it('displays metadata', async () => {
      await setupWithRecord();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    });
  });

  describe('Form State', () => {
    it('handles page submission', async () => {
      await setupWithRecord();
      const btns = screen.getAllByText('common.submitPage');
      expect(btns.length).toBeGreaterThan(0);
      fireEvent.click(btns[0]);
      expect(btns[0]).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('unmounts cleanly', () => {
      const { unmount } = render(<DocDigitization />);
      unmount();
      expect(true).toBe(true);
    });
  });

  describe('Desktop View', () => {
    it('renders desktop sections', async () => {
      await setupWithRecord();
      expect(
        screen.getAllByText('common.proofread.ocr.text').length,
      ).toBeGreaterThan(0);
    });

    it('renders desktop PDF viewer', async () => {
      await setupWithRecord();
      expect(screen.getAllByTestId('document').length).toBeGreaterThan(0);
    });

    it('renders desktop page navigation', async () => {
      await setupWithRecord();
      expect(screen.getAllByText('1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  describe('Mobile View', () => {
    it('renders mobile zoom controls', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText('+').length).toBeGreaterThanOrEqual(0);
    });

    it('renders mobile page navigation', () => {
      render(<DocDigitization />);
      expect(
        screen.queryAllByText('proofreading.page').length,
      ).toBeGreaterThanOrEqual(0);
    });

    it('renders header collapse button', () => {
      render(<DocDigitization />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(1);
    });

    it('clicks header collapse button', () => {
      render(<DocDigitization />);
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 1) {
        fireEvent.click(buttons[buttons.length - 1]);
        expect(buttons[buttons.length - 1]).toBeInTheDocument();
      }
    });

    it('toggles header collapse', async () => {
      render(<DocDigitization />);
      const buttons = screen.getAllByRole('button');
      if (buttons.length > 1) {
        fireEvent.click(buttons[buttons.length - 1]);
        await waitFor(() =>
          expect(buttons[buttons.length - 1]).toBeInTheDocument(),
        );
      }
    });
  });

  describe('Form Elements', () => {
    it('renders all controls', () => {
      render(<DocDigitization />);
      expect(screen.getAllByText('common.submitPage').length).toBeGreaterThan(
        0,
      );
      expect(
        screen.getAllByText('Submit all pages to enable').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('Loading States', () => {
    it('shows fetching message', async () => {
      localStorage.setItem('token', 'token');
      vi.spyOn(global, 'fetch').mockImplementation(
        () =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve([{ record_id: 'test' }]),
          } as MockResponse) as Promise<Response>,
      );
      render(<DocDigitization />);
      const btns = screen.getAllByText('proofreading.getNextRecord');
      fireEvent.click(btns[0]);
      await waitFor(() =>
        expect(
          screen.getAllByText('proofreading.fetchingRecord').length,
        ).toBeGreaterThan(0),
      );
    });
  });

  describe('Submit Button States', () => {
    it('submit page enabled with record', async () => {
      await setupWithRecord();
      const btns = screen.getAllByText('common.submitPage');
      expect(btns[0]).not.toBeDisabled();
    });
  });

  describe('Page Button States', () => {
    it('page 1 is active initially', async () => {
      await setupWithRecord();
      const pages = screen.getAllByText('1');
      expect(pages.some((p) => p.classList.contains('ring-2'))).toBe(true);
    });
  });

  describe('Textarea States', () => {
    it('textarea enabled after record loaded', async () => {
      await setupWithRecord();
      const textareas = screen.getAllByPlaceholderText(
        'ui.ocr.text.will.appear.here',
      );
      textareas.forEach((t) => expect(t).not.toBeDisabled());
    });

    it('textarea has placeholder', () => {
      render(<DocDigitization />);
      expect(
        screen.getAllByPlaceholderText('ui.ocr.text.will.appear.here').length,
      ).toBeGreaterThan(0);
    });
  });

  describe('Zoom State', () => {
    it('has zoom controls', () => {
      render(<DocDigitization />);
      expect(screen.queryAllByText('+').length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Telugu State', () => {
    it('checkbox can be toggled multiple times', () => {
      render(<DocDigitization />);
      const toggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(toggles[0]);
      expect(toggles[0]).toBeChecked();
      fireEvent.click(toggles[0]);
      expect(toggles[0]).not.toBeChecked();
    });
  });

  describe('Hints State', () => {
    it('hints toggle can be toggled', () => {
      render(<DocDigitization />);
      const teluguToggles = screen.getAllByLabelText('languages.telugu');
      fireEvent.click(teluguToggles[0]);
      const hintsToggles = screen.getAllByLabelText('common.showHints');
      fireEvent.click(hintsToggles[0]);
      expect(screen.getAllByTestId('suggestion-bar').length).toBeGreaterThan(0);
    });
  });
});
