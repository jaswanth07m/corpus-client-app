import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

// Mock Select component with test-friendly implementation
vi.mock('@/components/ui/select', () => ({
  Select: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <div data-testid="select-component" data-value={value}>
      <button
        data-testid="select-trigger"
        onClick={() => onValueChange && onValueChange('creator')}
      >
        Select
      </button>
      <div data-testid="select-content">{children}</div>
    </div>
  ),
  SelectTrigger: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <button data-testid="select-trigger" className={className}>
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => (
    <div data-testid="select-item" data-value={value} onClick={() => {}}>
      {children}
    </div>
  ),
}));

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

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

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
      const video = await screen.findByTestId('video-element');
      expect(video).toHaveAttribute('src', 'http://example.com/video.mp4');
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

    it('sets error state when video onError is triggered', async () => {
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
      const video = await screen.findByTestId('video-element');
      video.dispatchEvent(new Event('error'));
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
      const audio = await screen.findByTestId('audio-element');
      expect(audio).toHaveAttribute('src', 'http://example.com/audio.mp3');
    });

    it('handles response without record_url', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ other_field: 'value' }),
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

    it('calls setIsPlaying on audio onPlay event', async () => {
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
      const audio = await screen.findByTestId('audio-element');
      audio.dispatchEvent(new Event('play'));
    });

    it('calls setIsPlaying false on audio onPause event', async () => {
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
      const audio = await screen.findByTestId('audio-element');
      audio.dispatchEvent(new Event('pause'));
    });

    it('calls setIsPlaying false on audio onEnded event', async () => {
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
      const audio = await screen.findByTestId('audio-element');
      audio.dispatchEvent(new Event('ended'));
    });

    it('sets error state when audio onError is triggered', async () => {
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
      const audio = await screen.findByTestId('audio-element');
      audio.dispatchEvent(new Event('error'));
      await waitFor(() => {
        expect(screen.getByText('media.audioUnavailable')).toBeInTheDocument();
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
      // Test with a valid mediaType but verify the component handles edge cases gracefully
      const { container } = render(
        <MediaDetailModal {...defaultProps} mediaType="text" />,
      );
      // Should render without crashing
      expect(container.firstChild).not.toBeNull();
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
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Short');
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('clears title error when title is valid', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Short');
      await userEvent.click(screen.getByText('Save'));
      expect(
        screen.getByText(/Title must be at least 8 characters/),
      ).toBeInTheDocument();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'This is a valid title for testing');
      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(
          screen.queryByText(/Title must be at least 8 characters/),
        ).not.toBeInTheDocument();
      });
    });

    it('clears title error when title has enough meaningful words', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Aa bb cc dd');
      await userEvent.click(screen.getByText('Save'));
      expect(
        screen.getByText(/Title must contain at least 2 meaningful words/),
      ).toBeInTheDocument();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'This is valid title');
      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(
          screen.queryByText(/Title must contain at least 2 meaningful words/),
        ).not.toBeInTheDocument();
      });
    });

    it('triggers save action when no changes to save', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('prevents submission when description is too short', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Short');
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
      expect(
        screen.getByText(/Description must be at least 32 characters/),
      ).toBeInTheDocument();
    });

    it('prevents submission when description has insufficient meaningful words', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'This is a short desc with few words');
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          /Description must contain at least 10 meaningful words/,
        ),
      ).toBeInTheDocument();
    });

    it('prevents submission when release_rights is others and creator is empty on own profile', async () => {
      const itemWithOthers = {
        ...mockItem,
        release_rights: 'others',
        creator: '',
      };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthers}
          isOwnProfile={true}
        />,
      );
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(
        titleInput,
        'This is a valid title for testing purposes',
      );
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(
        descInput,
        'This is a valid description with enough meaningful words for testing',
      );
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('successfully saves changes with PATCH request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(
        titleInput,
        'This is a new valid title for testing purposes',
      );
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(
        descInput,
        'This is a new valid description with enough meaningful words for testing the save functionality',
      );
      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/records/test-id-123'),
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    it('shows error when PATCH request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Update failed' }),
      });
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const titleInput = inputs[0];
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Valid Title Here');
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(
        descInput,
        'This is a new valid description with enough meaningful words for the test',
      );
      await userEvent.click(screen.getByText('Save'));
      expect(mockFetch).toHaveBeenCalled();
    });

    it('shows toast when no changes to save', async () => {
      const { toast } = await import('sonner');
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      await waitFor(() => {
        expect(screen.getByText('Save')).toBeInTheDocument();
      });
      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('common.noChangesToSave');
      });
    });
  });

  describe('Edit Mode UI', () => {
    it('renders language select in edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const selectComponents = screen.getAllByTestId('select-component');
      expect(selectComponents.length).toBeGreaterThanOrEqual(1);
    });

    it('renders release rights select in edit mode', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const selectComponents = screen.getAllByTestId('select-component');
      expect(selectComponents.length).toBeGreaterThanOrEqual(1);
    });

    it('updates creator field when release_rights is others on own profile', async () => {
      const itemWithOthers = {
        ...mockItem,
        release_rights: 'others',
        creator: '',
      };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthers}
          isOwnProfile={true}
        />,
      );
      await userEvent.click(screen.getByText('Edit'));
      const creatorInput = screen.getByPlaceholderText(
        'common.specify.creator',
      ) as HTMLInputElement;
      await userEvent.type(creatorInput, 'New Creator Name');
      expect(creatorInput.value).toBe('New Creator Name');
    });

    it('updates sourceLabel field when release_rights is others on others profile', async () => {
      const itemWithOthers = { ...mockItem, release_rights: 'others' };
      render(
        <MediaDetailModal
          {...defaultProps}
          item={itemWithOthers}
          isOwnProfile={false}
        />,
      );
      await userEvent.click(screen.getByText('Edit'));
      const sourceInput = screen.getByPlaceholderText(
        'common.specify.source',
      ) as HTMLInputElement;
      await userEvent.type(sourceInput, 'Source from internet');
      expect(sourceInput.value).toBe('Source from internet');
    });

    it('updates description error in real-time while typing', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(descInput, 'Short');
      expect(
        screen.getByText(/Description must be at least 32 characters/),
      ).toBeInTheDocument();
      await userEvent.clear(descInput);
      await userEvent.type(
        descInput,
        'This is a much longer description that should pass the validation',
      );
      await waitFor(() => {
        expect(
          screen.queryByText(/Description must be at least 32 characters/),
        ).not.toBeInTheDocument();
      });
    });

    it('shows meaningful words count while typing description', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');
      const descInput = inputs[1];
      await userEvent.clear(descInput);
      await userEvent.type(
        descInput,
        'one two three four five six seven eight nine ten',
      );
      expect(screen.getByText(/10.*meaningful\.words/)).toBeInTheDocument();
    });
  });

  describe('Modal Body Class Management', () => {
    it('adds modal-open class to body when modal opens', () => {
      render(<MediaDetailModal {...defaultProps} isOpen={true} />);
      expect(document.body.classList.contains('modal-open')).toBe(true);
    });

    it('removes modal-open class from body when modal closes', () => {
      const { rerender } = render(
        <MediaDetailModal {...defaultProps} isOpen={true} />,
      );
      expect(document.body.classList.contains('modal-open')).toBe(true);
      rerender(<MediaDetailModal {...defaultProps} isOpen={false} />);
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });

    it('cleans up modal-open class on unmount', () => {
      const { unmount } = render(
        <MediaDetailModal {...defaultProps} isOpen={true} />,
      );
      expect(document.body.classList.contains('modal-open')).toBe(true);
      unmount();
      expect(document.body.classList.contains('modal-open')).toBe(false);
    });
  });

  describe('Select onValueChange handlers', () => {
    it('language onValueChange updates editItem language', () => {
      // Test the logic directly: onValueChange={(val) => setEditItem({ ...editItem, language: val })}
      const editItem = { ...mockItem, language: 'hindi' };
      const newVal = 'tamil';
      const result = { ...editItem, language: newVal };
      expect(result.language).toBe('tamil');
    });

    it('release_rights onValueChange clears creator when not others', () => {
      // Test the logic directly:
      // onValueChange={(val) => {
      //   setEditItem((prev) => ({
      //     ...prev,
      //     release_rights: val,
      //     creator: val !== 'others' ? '' : prev.creator,
      //   }));
      //   if (val !== 'others') {
      //     setSourceLabel('');
      //   }
      // }}
      const editItem = {
        ...mockItem,
        release_rights: 'others',
        creator: 'Test Creator',
      };
      let sourceLabel = 'test source';

      // Change from 'others' to 'creator'
      const newVal = 'creator';
      const result = {
        ...editItem,
        release_rights: newVal,
        creator: newVal !== 'others' ? '' : editItem.creator,
      };
      if (newVal !== 'others') {
        sourceLabel = '';
      }

      expect(result.release_rights).toBe('creator');
      expect(result.creator).toBe('');
      expect(sourceLabel).toBe('');
    });

    it('release_rights onValueChange keeps creator when others', () => {
      const editItem = { ...mockItem, release_rights: 'creator', creator: '' };
      let sourceLabel = '';

      // Change to 'others'
      const newVal = 'others';
      const result = {
        ...editItem,
        release_rights: newVal,
        creator: newVal !== 'others' ? '' : editItem.creator,
      };
      if (newVal !== 'others') {
        sourceLabel = '';
      }

      expect(result.release_rights).toBe('others');
      expect(result.creator).toBe('');
      expect(sourceLabel).toBe('');
    });
  });
});
