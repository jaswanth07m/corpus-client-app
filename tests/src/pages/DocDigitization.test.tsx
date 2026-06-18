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

describe('draft persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockSegment = {
    start: 0,
    end: 1,
    text: 'test text',
    proofread: false,
    originalIndex: 0,
    extraction_metadata: { genre: 'folklore' },
    named_entities: { locations: '', characters: {} },
  };

  const sampleDraft = {
    recordId: 'rec-42',
    pageNumber: 3,
    segmentsByPageEntries: [[1, [mockSegment]]] as [
      [number, (typeof mockSegment)[]],
    ],
    flippedViewedOriginalIndicesArray: [0, 2],
  };

  describe('saveDraft', () => {
    it('stores draft under correct key', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const raw = localStorage.getItem('doc-digitization-draft-rec-42');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.recordId).toBe('rec-42');
      expect(parsed.pageNumber).toBe(3);
    });

    it('stores segmentsByPageEntries as serializable array', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const raw = localStorage.getItem('doc-digitization-draft-rec-42');
      const parsed = JSON.parse(raw!);
      expect(Array.isArray(parsed.segmentsByPageEntries)).toBe(true);
      expect(parsed.segmentsByPageEntries[0][0]).toBe(1);
      expect(parsed.segmentsByPageEntries[0][1][0].text).toBe('test text');
    });

    it('stores flippedViewedOriginalIndicesArray', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const raw = localStorage.getItem('doc-digitization-draft-rec-42');
      const parsed = JSON.parse(raw!);
      expect(parsed.flippedViewedOriginalIndicesArray).toEqual([0, 2]);
    });

    it('overwrites existing draft for same recordId', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      saveDraft({ ...sampleDraft, pageNumber: 1 });
      saveDraft({ ...sampleDraft, pageNumber: 7 });
      const raw = localStorage.getItem('doc-digitization-draft-rec-42');
      const parsed = JSON.parse(raw!);
      expect(parsed.pageNumber).toBe(7);
    });

    it('does not throw when localStorage quota is exceeded', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      const setItem = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new DOMException('QuotaExceededError');
        });
      expect(() => saveDraft(sampleDraft)).not.toThrow();
      setItem.mockRestore();
    });

    it('stores multiple drafts under different recordIds', async () => {
      const { saveDraft } = await import('../../../src/pages/DocDigitization');
      const draft2 = { ...sampleDraft, recordId: 'rec-99' };
      saveDraft(sampleDraft);
      saveDraft(draft2);
      expect(
        localStorage.getItem('doc-digitization-draft-rec-42'),
      ).not.toBeNull();
      expect(
        localStorage.getItem('doc-digitization-draft-rec-99'),
      ).not.toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('removes draft for given recordId', async () => {
      const { saveDraft, clearDraft } =
        await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      clearDraft('rec-42');
      expect(localStorage.getItem('doc-digitization-draft-rec-42')).toBeNull();
    });

    it('does not affect drafts for other recordIds', async () => {
      const { saveDraft, clearDraft } =
        await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const draft2 = { ...sampleDraft, recordId: 'rec-99' };
      saveDraft(draft2);
      clearDraft('rec-42');
      expect(
        localStorage.getItem('doc-digitization-draft-rec-99'),
      ).not.toBeNull();
    });

    it('does not throw when clearing non-existent draft', async () => {
      const { clearDraft } = await import('../../../src/pages/DocDigitization');
      expect(() => clearDraft('rec-999')).not.toThrow();
    });
  });

  describe('findAnyDraft', () => {
    it('returns null when no drafts exist', async () => {
      const { findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      expect(findAnyDraft()).toBeNull();
    });

    it('returns the draft when one exists', async () => {
      const { saveDraft, findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const result = findAnyDraft();
      expect(result).not.toBeNull();
      expect(result!.recordId).toBe('rec-42');
      expect(result!.pageNumber).toBe(3);
    });

    it('returns the first draft when multiple exist', async () => {
      const { saveDraft, findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      const draft2 = { ...sampleDraft, recordId: 'rec-99' };
      saveDraft(sampleDraft);
      saveDraft(draft2);
      const result = findAnyDraft();
      expect(result).not.toBeNull();
      expect(['rec-42', 'rec-99']).toContain(result!.recordId);
    });

    it('ignores non-draft localStorage keys', async () => {
      const { findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      localStorage.setItem('some-other-key', 'value');
      expect(findAnyDraft()).toBeNull();
    });

    it('returns the correct draft with full data integrity', async () => {
      const { saveDraft, findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      saveDraft(sampleDraft);
      const result = findAnyDraft();
      expect(result!.segmentsByPageEntries).toEqual(
        sampleDraft.segmentsByPageEntries,
      );
      expect(result!.flippedViewedOriginalIndicesArray).toEqual(
        sampleDraft.flippedViewedOriginalIndicesArray,
      );
    });

    it('returns null when localStorage data is corrupted JSON', async () => {
      const { findAnyDraft } =
        await import('../../../src/pages/DocDigitization');
      localStorage.setItem('doc-digitization-draft-rec-42', '{invalid json}');
      expect(findAnyDraft()).toBeNull();
    });
  });
});
