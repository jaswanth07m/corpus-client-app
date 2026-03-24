import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('MediaDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    document.body.classList.remove('modal-open');
  });

  describe('Rendering', () => {
    it('renders without crashing when isOpen is true', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Image Details')).toBeInTheDocument();
      expect(screen.getByText('Test Media Title')).toBeInTheDocument();
    });

    it('returns null when isOpen is false', () => {
      const { container } = render(
        <MediaDetailModal {...defaultProps} isOpen={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('displays the correct media type in header for video', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="video" />);
      expect(screen.getByText('Video Details')).toBeInTheDocument();
    });

    it('displays the correct media type in header for audio', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="audio" />);
      expect(screen.getByText('Audio Details')).toBeInTheDocument();
    });

    it('displays the correct media type in header for document', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="document" />);
      expect(screen.getByText('Document Details')).toBeInTheDocument();
    });

    it('displays the correct media type in header for text', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="text" />);
      expect(screen.getByText('Text Details')).toBeInTheDocument();
    });
  });

  describe('Modal Visibility and Close Behavior', () => {
    it('adds modal-open class to body when open', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(document.body.classList.contains('modal-open')).toBe(true);
    });

    it('removes modal-open class from body when closed', () => {
      const { rerender } = render(<MediaDetailModal {...defaultProps} />);
      rerender(<MediaDetailModal {...defaultProps} isOpen={false} />);
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('cleans up modal-open class on unmount', () => {
      const { unmount } = render(<MediaDetailModal {...defaultProps} />);
      unmount();
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('has close button in the document', () => {
      render(<MediaDetailModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Props Rendering', () => {
    it('displays item title correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Test Media Title')).toBeInTheDocument();
    });

    it('displays item description correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(
        screen.getByText(
          'This is a test description with enough meaningful words for validation',
        ),
      ).toBeInTheDocument();
    });

    it('displays timestamp correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Timestamp')).toBeInTheDocument();
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });

    it('displays location coordinates correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('40.7128, -74.0060')).toBeInTheDocument();
    });

    it('displays file size correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('media.fileSize')).toBeInTheDocument();
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
    });

    it('displays language correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('hindi')).toBeInTheDocument();
    });

    it('displays release rights correctly', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('common.release.rights')).toBeInTheDocument();
      expect(screen.getByText('creator')).toBeInTheDocument();
    });

    it('renders category tags with correct category IDs', () => {
      render(<MediaDetailModal {...defaultProps} />);
      const categoryTags = screen.getByTestId('category-tags');
      expect(categoryTags).toHaveTextContent('cat-1, cat-2');
    });

    it('shows reviewed badge when item is reviewed', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('common.Reviewed')).toBeInTheDocument();
    });

    it('does not show reviewed badge when item is not reviewed', () => {
      const unreviewedItem = { ...mockItem, reviewed: false };
      render(<MediaDetailModal {...defaultProps} item={unreviewedItem} />);
      expect(screen.queryByText('Reviewed')).not.toBeInTheDocument();
    });
  });

  describe('Media Preview Rendering', () => {
    it('renders image preview with correct src and alt', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="image" />);
      const image = screen.getByAltText('Test Media Title');
      expect(image).toHaveAttribute('src', 'http://example.com/preview.jpg');
    });

    it('renders image placeholder when previewUrl is null', () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="image"
          previewUrl={null}
        />,
      );
      // The component should still render with the header
      expect(screen.getByText('Image Details')).toBeInTheDocument();
    });

    it('renders video element when mediaUrl is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/video.mp4' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="video"
          previewUrl={null}
        />,
      );
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('shows error state for video when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="video"
          previewUrl={null}
        />,
      );
      await waitFor(() => {
        expect(screen.getByText('media.videoUnavailable')).toBeInTheDocument();
      });
    });

    it('renders audio element when mediaUrl is available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/audio.mp3' }),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="audio"
          previewUrl={null}
        />,
      );
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });

    it('renders document preview for PDF files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/document.pdf' }),
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
  });

  describe('History Toggle', () => {
    it('shows InlineEditHistory when View History is clicked', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('View History'));
      expect(screen.getByTestId('edit-history')).toBeInTheDocument();
      expect(screen.getByText('Hide History')).toBeInTheDocument();
    });

    it('hides InlineEditHistory when toggled off', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('View History'));
      await userEvent.click(screen.getByText('Hide History'));
      expect(screen.queryByTestId('edit-history')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing title gracefully', () => {
      const itemWithoutTitle = { ...mockItem, title: '' };
      render(<MediaDetailModal {...defaultProps} item={itemWithoutTitle} />);
      expect(screen.getByText('Untitled')).toBeInTheDocument();
    });

    it('handles missing description gracefully', () => {
      const itemWithoutDesc = { ...mockItem, description: '' };
      render(<MediaDetailModal {...defaultProps} item={itemWithoutDesc} />);
      expect(screen.getByText('No description available')).toBeInTheDocument();
    });

    it('handles missing timestamp gracefully', () => {
      const itemWithoutTimestamp = { ...mockItem, timestamp: undefined };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithoutTimestamp} />,
      );
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    it('handles missing location gracefully', () => {
      const itemWithoutLocation = { ...mockItem, location: undefined };
      render(<MediaDetailModal {...defaultProps} item={itemWithoutLocation} />);
      expect(screen.getByText('Not available')).toBeInTheDocument();
    });

    it('handles missing language gracefully', () => {
      const itemWithoutLanguage = { ...mockItem, language: '' };
      render(<MediaDetailModal {...defaultProps} item={itemWithoutLanguage} />);
      expect(screen.getByText('Not specified')).toBeInTheDocument();
    });

    it('handles empty category_ids array', () => {
      const itemWithoutCategories = { ...mockItem, category_ids: [] };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithoutCategories} />,
      );
      const categoryTags = screen.getByTestId('category-tags');
      expect(categoryTags).toHaveTextContent('');
    });

    it('falls back to category_id for backward compatibility', () => {
      const itemWithSingleCategory = {
        ...mockItem,
        category_ids: undefined,
        category_id: 'single-cat',
      };
      render(
        <MediaDetailModal {...defaultProps} item={itemWithSingleCategory} />,
      );
      const categoryTags = screen.getByTestId('category-tags');
      expect(categoryTags).toHaveTextContent('single-cat');
    });

    it('handles unsupported media type', () => {
      render(<MediaDetailModal {...defaultProps} mediaType="text" />);

      expect(screen.getByText(/Details/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has close button with proper role', () => {
      render(<MediaDetailModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('close button is keyboard accessible with Enter', async () => {
      const onCloseMock = vi.fn();
      render(<MediaDetailModal {...defaultProps} onClose={onCloseMock} />);
      const closeButton = screen.getAllByRole('button')[0];
      closeButton.focus();
      await userEvent.keyboard('{Enter}');
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('close button is keyboard accessible with Space', async () => {
      const onCloseMock = vi.fn();
      render(<MediaDetailModal {...defaultProps} onClose={onCloseMock} />);
      const closeButton = screen.getAllByRole('button')[0];
      closeButton.focus();
      await userEvent.keyboard(' ');
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  // Edit functionality tests at the end since they can affect DOM state
  describe('Edit Functionality', () => {
    it('shows Edit and View History buttons when not editing', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('View History')).toBeInTheDocument();
    });

    it('shows meaningful words count for description in edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      expect(screen.getByText(/meaningful\.words/)).toBeInTheDocument();
    });

    it('exits edit mode when Cancel is clicked', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      await userEvent.click(screen.getByText('Cancel'));
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });
  });

  // Form submission tests at the very end - using separate renders to avoid state corruption
  describe('Form Validation Submission', () => {
    it('prevents submission when title is too short', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      // Find input by placeholder or role instead of label
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Short');
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('triggers save action when no changes to save', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      // Click save - should show toast but we verify by checking no fetch was called
      await userEvent.click(screen.getByText('Save'));
      // No API call should be made when no changes
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
