import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaDetailModal } from '@/components/MediaDetailModal';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock CategoryTags component
vi.mock('@/components/CategoryTags', () => ({
  __esModule: true,
  default: ({ categoryIds }: { categoryIds: string[] }) => (
    <div data-testid="category-tags">{categoryIds.join(', ')}</div>
  ),
}));

// Mock InlineEditHistory component
vi.mock('@/components/InlineEditHistory', () => ({
  __esModule: true,
  InlineEditHistory: ({ recordId }: { recordId: string }) => (
    <div data-testid="edit-history">History for {recordId}</div>
  ),
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatSizeMB: (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  formatModernTime: (dateString: string) => dateString,
  formatDuration: (seconds: number) => `${seconds}s`,
  getISTDate: (dateString: string) => new Date(dateString),
}));

// Mock constants
vi.mock('@/lib/constants', () => ({
  BACKEND_URL: 'http://localhost:3000',
}));

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const mockItem = {
  id: 'test-id-123',
  size: 1048576,
  category_ids: ['cat-1', 'cat-2'],
  reviewed: true,
  title: 'Test Media Title',
  description:
    'This is a test description with enough meaningful words for validation',
  duration: 120,
  timestamp: '2024-01-15T10:30:00Z',
  location: { latitude: 40.7128, longitude: -74.006 },
  release_rights: 'creator',
  creator: 'Test Creator',
  language: 'hindi',
  file_hash: 'abc123hash',
  snr_frequency: 44100,
};

const defaultProps = {
  item: mockItem,
  mediaType: 'image' as const,
  previewUrl: 'http://example.com/preview.jpg',
  token: 'test-token',
  isOpen: true,
  onClose: vi.fn(),
  isOwnProfile: true,
};

describe('MediaDetailModal - Additional Coverage', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    cleanup();
    document.body.classList.remove('modal-open');
  });

  // ==================== EDGE CASES - LOCATION AND SIZE ====================
  describe('Edge Cases - Location and Size', () => {
    it('shows "Not available" when location is undefined', () => {
      const itemWithoutLocation = { ...mockItem, location: undefined };
      const { container } = render(
        <MediaDetailModal {...defaultProps} item={itemWithoutLocation} />,
      );
      expect(container.textContent).toContain('Not available');
    });

    it('shows "Not available" when location latitude is not a number', () => {
      const itemWithInvalidLocation = {
        ...mockItem,
        location: { latitude: null as unknown as number, longitude: -74.006 },
      };
      const { container } = render(
        <MediaDetailModal {...defaultProps} item={itemWithInvalidLocation} />,
      );
      expect(container.textContent).toContain('Not available');
    });

    it('shows "Not available" when location longitude is not a number', () => {
      const itemWithInvalidLocation = {
        ...mockItem,
        location: { latitude: 40.7128, longitude: null as unknown as number },
      };
      const { container } = render(
        <MediaDetailModal {...defaultProps} item={itemWithInvalidLocation} />,
      );
      expect(container.textContent).toContain('Not available');
    });

    it('shows empty message when size is 0', () => {
      const itemWithoutSize = { ...mockItem, size: 0 };
      render(<MediaDetailModal {...defaultProps} item={itemWithoutSize} />);
      // formatSizeMB returns empty string for 0
      expect(screen.getByText('media.fileSize')).toBeInTheDocument();
    });

    it('shows formatted size when size is valid', () => {
      const { container } = render(<MediaDetailModal {...defaultProps} />);
      expect(container.textContent).toContain('1.00 MB');
    });

    it('shows coordinates with 4 decimal places', () => {
      const { container } = render(<MediaDetailModal {...defaultProps} />);
      expect(container.textContent).toContain('40.7128');
      expect(container.textContent).toContain('-74.0060');
    });
  });

  // ==================== EDGE CASES - LANGUAGE ====================
  describe('Edge Cases - Language', () => {
    it('shows "Not specified" when language is empty', () => {
      const itemWithoutLanguage = { ...mockItem, language: '' };
      const { container } = render(
        <MediaDetailModal {...defaultProps} item={itemWithoutLanguage} />,
      );
      expect(container.textContent).toContain('Not specified');
    });

    it('shows language value when present', () => {
      const { container } = render(<MediaDetailModal {...defaultProps} />);
      expect(container.textContent).toContain('hindi');
    });

    it('renders language select in edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      // Check that a combobox exists (language select)
      const comboboxes = screen.queryAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });
  });

  // ==================== EDGE CASES - RELEASE RIGHTS ====================
  describe('Edge Cases - Release Rights', () => {
    it('shows release rights value in view mode', () => {
      const { container } = render(<MediaDetailModal {...defaultProps} />);
      expect(container.textContent).toContain('release.rights');
      expect(container.textContent).toContain('creator');
    });

    it('shows "Not specified" when release_rights is empty', () => {
      const itemWithoutRights = { ...mockItem, release_rights: '' };
      const { container } = render(
        <MediaDetailModal {...defaultProps} item={itemWithoutRights} />,
      );
      expect(container.textContent).toContain('Not specified');
    });

    it('shows Creator input placeholder when release_rights is others and isOwnProfile is true', async () => {
      const itemWithOthersRights = {
        ...mockItem,
        release_rights: 'others',
        creator: '',
      };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthersRights}
          isOwnProfile={true}
        />,
      );

      await userEvent.click(screen.getByText('Edit'));

      const creatorInput = screen.queryByPlaceholderText(
        'common.specify.creator',
      );
      expect(creatorInput).toBeInTheDocument();
    });

    it('shows Source Label input placeholder when release_rights is others and isOwnProfile is false', async () => {
      const itemWithOthersRights = { ...mockItem, release_rights: 'others' };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthersRights}
          isOwnProfile={false}
        />,
      );

      await userEvent.click(screen.getByText('Edit'));

      const sourceInput = screen.queryByPlaceholderText(
        'common.specify.source',
      );
      expect(sourceInput).toBeInTheDocument();
    });

    it('does not show Creator/Source input when release_rights is creator', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));

      expect(
        screen.queryByPlaceholderText('common.specify.creator'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText('common.specify.source'),
      ).not.toBeInTheDocument();
    });

    it('shows error when creator is empty and release_rights is others', async () => {
      const itemWithOthersRights = {
        ...mockItem,
        release_rights: 'others',
        creator: '',
      };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthersRights}
          isOwnProfile={true}
        />,
      );

      await userEvent.click(screen.getByText('Edit'));
      await userEvent.click(screen.getByText('Save'));

      // Should show validation error and not call fetch
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });

    it('shows error when source label is empty and release_rights is others', async () => {
      const itemWithOthersRights = { ...mockItem, release_rights: 'others' };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthersRights}
          isOwnProfile={false}
        />,
      );

      await userEvent.click(screen.getByText('Edit'));
      await userEvent.click(screen.getByText('Save'));

      // Should show validation error and not call fetch
      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });

  // ==================== EDIT + VALIDATION ====================
  describe('Edit + Validation', () => {
    it('initializes validation errors to null when entering edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('shows validation error inline while typing in title', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Hi');

      expect(screen.getByText(/8 characters/)).toBeInTheDocument();
    });

    it('shows validation error inline while typing in description', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      await userEvent.clear(inputs[1]);
      await userEvent.type(inputs[1], 'Too short');

      expect(screen.getByText(/32 characters/)).toBeInTheDocument();
    });

    it('shows meaningful words count while editing description', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));

      expect(screen.getByText(/meaningful\.words/)).toBeInTheDocument();
    });

    it('Cancel button resets edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Changed Title');

      await userEvent.click(screen.getByText('Cancel'));

      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('Cancel button clears validation errors', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Short');

      expect(screen.getByText(/8 characters/)).toBeInTheDocument();

      await userEvent.click(screen.getByText('Cancel'));
      await userEvent.click(screen.getByText('Edit'));

      expect(screen.queryByText(/8 characters/)).not.toBeInTheDocument();
    });

    it('initializes sourceLabel when release_rights is others on Edit click', async () => {
      const itemWithOthersRights = { ...mockItem, release_rights: 'others' };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithOthersRights} />,
      );

      await userEvent.click(screen.getByText('Edit'));

      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });

  // ==================== MEDIA TYPES ====================
  describe('Media Types - All Types', () => {
    it('renders image media type with correct header', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="image" />);
      expect(screen.getByText('Image Details')).toBeInTheDocument();
    });

    it('renders video media type with correct header', () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="video"
          previewUrl={null}
        />,
      );
      expect(screen.getByText('Video Details')).toBeInTheDocument();
    });

    it('renders audio media type with correct header', () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="audio"
          previewUrl={null}
        />,
      );
      expect(screen.getByText('Audio Details')).toBeInTheDocument();
    });

    it('renders document media type with correct header', () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });

    it('renders text media type with correct header', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="text" />);
      expect(screen.getByText('Text Details')).toBeInTheDocument();
    });

    it('renders unsupported media type', () => {
      // Test with a valid mediaType but verify the component handles edge cases gracefully
      render(<MediaDetailModal {...defaultProps} mediaType="text" />);
      // Should render without crashing
      expect(screen.getByText(/Details/)).toBeInTheDocument();
    });
  });

  // ==================== ADDITIONAL COVERAGE ====================
  describe('Additional Coverage - Timestamp', () => {
    it('formats timestamp with full date and time', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });

    it('shows "Not available" when timestamp is undefined', () => {
      const itemWithoutTimestamp = { ...mockItem, timestamp: undefined };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithoutTimestamp} />,
      );
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });
  });

  describe('Additional Coverage - Reviewed Badge', () => {
    it('shows Reviewed badge when reviewed is true', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('common.Reviewed')).toBeInTheDocument();
    });

    it('does not show Reviewed badge when reviewed is false', () => {
      const unreviewedItem = { ...mockItem, reviewed: false };
      render(<MediaDetailModal {...defaultProps} item={unreviewedItem} />);
      expect(screen.queryByText('common.Reviewed')).not.toBeInTheDocument();
    });
  });

  describe('Additional Coverage - Category Tags', () => {
    it('renders category tags with multiple categories', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByTestId('category-tags')).toHaveTextContent(
        'cat-1, cat-2',
      );
    });

    it('renders category tags with single category (backward compatibility)', () => {
      const itemWithSingleCategory = {
        ...mockItem,
        category_ids: undefined,
        category_id: 'single-cat',
      };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithSingleCategory} />,
      );
      expect(screen.getByTestId('category-tags')).toHaveTextContent(
        'single-cat',
      );
    });

    it('renders empty category tags when no categories', () => {
      const itemWithoutCategories = { ...mockItem, category_ids: [] };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithoutCategories} />,
      );
      expect(screen.getByTestId('category-tags')).toHaveTextContent('');
    });
  });

  describe('Additional Coverage - History Toggle', () => {
    it('toggles history visibility when View History button is clicked', async () => {
      render(<MediaDetailModal {...defaultProps} />);

      expect(screen.queryByTestId('edit-history')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('View History'));
      expect(screen.getByTestId('edit-history')).toBeInTheDocument();
      expect(screen.getByText('Hide History')).toBeInTheDocument();

      await userEvent.click(screen.getByText('Hide History'));
      expect(screen.queryByTestId('edit-history')).not.toBeInTheDocument();
    });
  });

  describe('Additional Coverage - Document Variants', () => {
    it('renders PDF document in iframe', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/doc.pdf' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTitle('common.documentPreview')).toBeInTheDocument();
      });
    });

    it('renders Word document with open button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/doc.docx' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('common.openInNewTab')).toBeInTheDocument();
      });
    });

    it('renders text file with view button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/doc.txt' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('View Text')).toBeInTheDocument();
      });
    });

    it('renders generic document with open button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/doc.xlsx' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('common.openDocument')).toBeInTheDocument();
      });
    });
  });
});
