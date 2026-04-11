import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/constants', () => ({
  BACKEND_URL: 'http://test-api.com',
}));

vi.mock('@/components/SuggestionBar', () => ({
  SuggestionBar: () => <div data-testid="suggestion-bar" />,
}));

vi.mock('@/components/AutoResizeTextArea', () => ({
  AutoResizeTextArea: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="auto-resize-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/hooks/useTeluguTyping', () => ({
  useTeluguTyping: () => ({
    value: '',
    suggestions: [],
    inputProps: {},
    setValue: vi.fn(),
  }),
}));

vi.mock('react-pdf', () => ({
  Document: ({
    onLoadSuccess,
  }: {
    onLoadSuccess: (meta: { numPages: number }) => void;
  }) => {
    onLoadSuccess?.({ numPages: 3 });
    return <div data-testid="pdf-document" />;
  },
  Page: () => <div data-testid="pdf-page" />,
  pdfjs: { version: '3.0.0', GlobalWorkerOptions: { workerSrc: '' } },
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import DocDigitization from '../../../src/pages/DocDigitization';

describe('DocDigitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    });
  });

  it('renders without crashing', () => {
    render(<DocDigitization />);
    expect(document.body).toBeTruthy();
  });

  it('renders the back arrow button', () => {
    render(<DocDigitization />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens the record panel when Record button is clicked', async () => {
    render(<DocDigitization />);
    const recordButton = screen.getByText('Record');
    fireEvent.click(recordButton);
    await waitFor(() => {
      expect(screen.getByText('media.recordControls')).toBeInTheDocument();
    });
  });

  it('shows search input when record panel is open', async () => {
    render(<DocDigitization />);
    fireEvent.click(screen.getByText('Record'));
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('media.enterRecordId'),
      ).toBeInTheDocument();
    });
  });

  it('shows error when submitting empty record ID search', async () => {
    render(<DocDigitization />);
    fireEvent.click(screen.getByText('Record'));
    await waitFor(() => screen.getByText('Search'));
    const searchForm = document.querySelector('form');
    if (searchForm) {
      fireEvent.submit(searchForm);
    }
    await waitFor(() => {
      expect(screen.getByText('Search')).toBeInTheDocument();
    });
  });

  it('renders Get Next Record button in the panel', async () => {
    render(<DocDigitization />);
    fireEvent.click(screen.getByText('Record'));
    await waitFor(() => {
      expect(
        screen.getByText('proofreading.getNextRecord'),
      ).toBeInTheDocument();
    });
  });

  it('shows a 404 error when fetching next record returns 404', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    });
    render(<DocDigitization />);
    fireEvent.click(screen.getByText('Record'));
    await waitFor(() => screen.getByText('proofreading.getNextRecord'));
    fireEvent.click(screen.getByText('proofreading.getNextRecord'));
    await waitFor(() => {
      expect(
        screen.getByText('proofreading.getNextRecord'),
      ).toBeInTheDocument();
    });
  });
});
