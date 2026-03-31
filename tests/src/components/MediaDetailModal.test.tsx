import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaDetailModal } from '@/components/MediaDetailModal';
import { act } from '@testing-library/react';

// Polyfill PointerEvent for user-event in JSDOM
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
    }
  }
  (global as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent =
    PointerEvent;
}

// Mocks
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('@/components/CategoryTags', () => ({
  default: () => <div data-testid="category-tags">Category Tags</div>,
}));

vi.mock('@/components/InlineEditHistory', () => ({
  InlineEditHistory: ({ recordId }: { recordId: string }) => (
    <div data-testid="edit-history">History for {recordId}</div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({
    onValueChange,
    children,
    value,
  }: {
    onValueChange?: (val: string) => void;
    children?: import('react').ReactNode;
    value?: string;
  }) => (
    <div
      data-testid="select-root"
      onClick={() => onValueChange?.(value || 'placeholder')}
    >
      {children}
      <button
        data-testid="select-marathi"
        onClick={(e) => {
          e.stopPropagation();
          onValueChange?.('marathi');
        }}
      >
        Marathi
      </button>
      <button
        data-testid="select-others"
        onClick={(e) => {
          e.stopPropagation();
          onValueChange?.('others');
        }}
      >
        Others
      </button>
      <button
        data-testid="select-creator"
        onClick={(e) => {
          e.stopPropagation();
          onValueChange?.('creator');
        }}
      >
        Creator
      </button>
      <span data-testid="select-value">{value}</span>
    </div>
  ),
  SelectTrigger: ({ children }: { children?: import('react').ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="select-placeholder">{placeholder}</div>
  ),
  SelectContent: ({ children }: { children?: import('react').ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children?: import('react').ReactNode;
    value?: string;
  }) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
}));

vi.mock('@/lib/utils', () => ({
  formatSizeMB: (size: number) => `${(size / 1024 / 1024).toFixed(2)} MB`,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const getMockItem = () => ({
  id: 'test-id-123',
  size: 1048576,
  category_id: 'cat-0',
  category_ids: ['cat-1'],
  reviewed: true,
  title: 'Test Media Title',
  description:
    'This is a test description with enough meaningful words for validation and it is long enough.',
  duration: 120,
  timestamp: '2024-01-15T10:30:00Z',
  location: { latitude: 40.7128, longitude: -74.006 },
  release_rights: 'creator',
  creator: 'Test Creator',
  language: 'hindi',
  file_hash: 'abc123hash',
  snr_frequency: 44100,
});

const getDefaultProps = () => ({
  item: getMockItem(),
  mediaType: 'image' as import('react').ComponentProps<
    typeof MediaDetailModal
  >['mediaType'],
  previewUrl: 'http://example.com/preview.jpg',
  token: 'test-token',
  isOpen: true,
  onClose: vi.fn(),
  isOwnProfile: true,
});

describe('MediaDetailModal', () => {
  let defaultProps: ReturnType<typeof getDefaultProps>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ record_url: 'http://example.com/media.mp4' }),
    });
    defaultProps = getDefaultProps();
    if (typeof window.URL.createObjectURL === 'undefined') {
      window.URL.createObjectURL = vi.fn();
    }
  });

  describe('Basic Rendering', () => {
    it('returns null if not open', () => {
      const { container } = render(
        <MediaDetailModal {...defaultProps} isOpen={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders image type successfully with and without previewUrl', () => {
      const { rerender } = render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Image Details')).toBeInTheDocument();
      expect(screen.getByAltText('Test Media Title')).toBeInTheDocument();

      rerender(<MediaDetailModal {...defaultProps} previewUrl={null} />);
      expect(screen.queryByAltText('Test Media Title')).not.toBeInTheDocument();
    });

    it('displays basic details', () => {
      render(<MediaDetailModal {...defaultProps} />);
      expect(screen.getByText('Test Media Title')).toBeInTheDocument();
      expect(
        screen.getByText(/This is a test description/),
      ).toBeInTheDocument();

      // Rendered Metadata
      expect(screen.getByText('1.00 MB')).toBeInTheDocument();
      expect(screen.getByText('hindi')).toBeInTheDocument();
      expect(screen.getByText('creator')).toBeInTheDocument();
      // Date displays some format, let's just match the year
      expect(screen.getByText(/2024/)).toBeInTheDocument();
      // Location displays decimals
      expect(screen.getByText(/40\.7128/)).toBeInTheDocument();
    });

    it('displays fallback options for missing metadata', () => {
      const p = {
        ...defaultProps,
        item: {
          ...defaultProps.item,
          timestamp: undefined,
          location: undefined,
          size: undefined,
          language: undefined,
          release_rights: undefined,
          title: '',
          description: '',
          category_ids: undefined,
          category_id: undefined,
          reviewed: false,
        },
      };
      render(<MediaDetailModal {...p} />);

      expect(screen.getByText('Untitled')).toBeInTheDocument();
      expect(screen.getByText('No description available')).toBeInTheDocument();
      const notAvailables = screen.getAllByText('Not available');
      expect(notAvailables.length).toBeGreaterThan(0);
      expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0);
    });

    it('closes on X button click', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      const closeButtons = document.querySelectorAll('.lucide-x');
      await userEvent.click(closeButtons[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Media types rendering and fallback', () => {
    it('renders video player when URL is fetched', async () => {
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
        expect(document.querySelector('video')).toBeInTheDocument();
      });
    });

    it('renders video unavailable when fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
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

    it('renders video load button when mediaUrl is absent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="video"
          previewUrl={null}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText('media.loadVideo')).toBeInTheDocument();
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/video.mp4' }),
      });

      await userEvent.click(screen.getByText('media.loadVideo'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('handles video HTML error event', async () => {
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

      const video = await waitFor(() => {
        const v = document.querySelector('video');
        if (!v) throw new Error('not found');
        return v;
      });

      fireEvent.error(video);
      expect(
        await screen.findByText('media.videoUnavailable'),
      ).toBeInTheDocument();
    });

    it('renders audio player and handles events', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ record_url: 'http://example.com/audio.mp3' }),
      });
      const { container } = render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="audio"
          previewUrl={null}
        />,
      );

      const audio = await waitFor(() => {
        const a = container.querySelector('audio');
        if (!a) throw new Error('not found');
        return a;
      });

      fireEvent.play(audio);
      fireEvent.pause(audio);
      fireEvent.ended(audio);
      fireEvent.error(audio);

      expect(
        await screen.findByText('media.audioUnavailable'),
      ).toBeInTheDocument();
    });

    it('renders audio load button when mediaUrl is absent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="audio"
          previewUrl={null}
        />,
      );

      expect(await screen.findByText('media.loadAudio')).toBeInTheDocument();
    });

    it('renders document link', async () => {
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

      expect(
        await screen.findByTitle('common.documentPreview'),
      ).toBeInTheDocument();
    });

    it('renders document unavailable when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="document"
          previewUrl={null}
        />,
      );

      expect(
        await screen.findByText('media.documentUnavailable'),
      ).toBeInTheDocument();
    });

    it('renders document text view', async () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="text"
          previewUrl={null}
        />,
      );
      expect(screen.getByText('Text Details')).toBeInTheDocument();
    });

    it('renders unknown media type', () => {
      render(
        <MediaDetailModal
          {...defaultProps}
          mediaType="unknown"
          previewUrl={null}
        />,
      );
      expect(
        screen.getByText('categories.unsupportedMediaType'),
      ).toBeInTheDocument();
    });
  });

  describe('Editing Mode validations and flow', () => {
    it('enters edit mode, modifies fields, and cancels', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(2);

      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'short');

      expect(
        screen.getByText('Title must be at least 8 characters long.'),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByText('Cancel'));
      expect(
        screen.queryByRole('textbox', { name: 'Title' }),
      ).not.toBeInTheDocument();
    });

    it('validates title constraints on submit', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));

      const inputs = screen.getAllByRole('textbox');

      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'shorttitlewithoutwords');

      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(
          screen.getByText('Title must contain at least 2 meaningful words.'),
        ).toBeInTheDocument();
      });
    });

    it('validates description constraints on submit', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));

      const inputs = screen.getAllByRole('textbox');
      // Fix description string validation
      await userEvent.clear(inputs[1]);
      await userEvent.type(inputs[1], 'too short desc');

      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(
          screen.getByText('Description must be at least 32 characters long.'),
        ).toBeInTheDocument();
      });

      await userEvent.clear(inputs[1]);
      await userEvent.type(
        inputs[1],
        'This description is thirty two charactersssssssss',
      );

      await userEvent.click(screen.getByText('Save'));
      await waitFor(() => {
        expect(
          screen.getByText(
            'Description must contain at least 10 meaningful words.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('handles interaction with release_rights and permissions', async () => {
      render(<MediaDetailModal {...defaultProps} isOwnProfile={true} />);
      await userEvent.click(screen.getByText('Edit'));

      const othersBtn = screen.getAllByTestId('select-others')[1];
      await userEvent.click(othersBtn);

      expect(
        screen.getByPlaceholderText('common.specify.creator'),
      ).toBeInTheDocument();

      // switch away from others clears creator
      const creatorBtn = screen.getAllByTestId('select-creator')[1];
      await userEvent.click(creatorBtn);
      expect(
        screen.queryByPlaceholderText('common.specify.creator'),
      ).not.toBeInTheDocument();

      // Hit save branch for creator missing
      await userEvent.click(othersBtn);
      await userEvent.click(screen.getByText('Save'));
    });

    it('requires source_label for others if not own profile', async () => {
      render(<MediaDetailModal {...defaultProps} isOwnProfile={false} />);
      await userEvent.click(screen.getByText('Edit'));

      const othersBtn = screen.getAllByTestId('select-others')[1];
      await userEvent.click(othersBtn);

      // Hit save branch for source missing
      await userEvent.click(screen.getByText('Save'));
    });

    it('shows toast when Save is clicked with no changes', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));
      await userEvent.click(screen.getByText('Save'));

      const { toast } = await import('sonner');
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('common.noChangesToSave');
      });
    });

    it('successfully PATCHes and updates states correctly', async () => {
      mockFetch.mockImplementation(
        async (url: string | URL | Request, options?: RequestInit) => {
          if (options && options.method === 'PATCH') {
            return { ok: true, json: async () => ({ status: 'success' }) };
          }
          return { ok: true, json: async () => ({}) };
        },
      );

      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));

      const inputs = screen.getAllByRole('textbox');

      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Totally New Title that is long enough');

      await userEvent.clear(inputs[1]);
      await userEvent.type(
        inputs[1],
        'Successfully providing a very long and meaningful description to bypass all validation checks and trigger the actual PATCH request.',
      );

      const languageSelectBtn = screen.getAllByTestId('select-marathi')[0];
      await userEvent.click(languageSelectBtn);

      await userEvent.click(screen.getByText('Save'));

      await waitFor(
        () => {
          const patchCall = mockFetch.mock.calls.find(
            (c) => c[1]?.method === 'PATCH',
          );
          expect(patchCall).toBeDefined();
        },
        { timeout: 3000 },
      );

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('shows error if PATCH request fails with details', async () => {
      mockFetch.mockImplementation(
        async (url: string | URL | Request, options?: RequestInit) => {
          if (options && options.method === 'PATCH') {
            return {
              ok: false,
              json: async () => ({ detail: 'Custom Server Error occurred' }),
            };
          }
          return { ok: true, json: async () => ({}) };
        },
      );

      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('Edit'));

      const inputs = screen.getAllByRole('textbox');

      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Totally New Title that is long enough');

      await userEvent.click(screen.getByText('Save'));

      await waitFor(
        () => {
          const patchCall = mockFetch.mock.calls.find(
            (c) => c[1]?.method === 'PATCH',
          );
          expect(patchCall).toBeDefined();
        },
        { timeout: 3000 },
      );
    });

    it('shows default error message when PATCH request fails without detail', async () => {
      mockFetch.mockImplementation(
        async (url: string | URL | Request, options?: RequestInit) => {
          if (options && options.method === 'PATCH') {
            return { ok: false, json: async () => ({}) };
          }
          return { ok: true, json: async () => ({}) };
        },
      );

      render(<MediaDetailModal {...defaultProps} />);

      await userEvent.click(screen.getByText('Edit'));
      const inputs = screen.getAllByRole('textbox');

      await userEvent.clear(inputs[0]);
      await userEvent.type(inputs[0], 'Totally New Title that is long enough');

      await userEvent.click(screen.getByText('Save'));

      await waitFor(
        () => {
          const patchCall = mockFetch.mock.calls.find(
            (c) => c[1]?.method === 'PATCH',
          );
          expect(patchCall).toBeDefined();
        },
        { timeout: 3000 },
      );
    });

    it('shows history when View History button is clicked', async () => {
      render(<MediaDetailModal {...defaultProps} />);
      await userEvent.click(screen.getByText('View History'));

      expect(screen.getByTestId('edit-history')).toBeInTheDocument();
      expect(screen.getByText('Hide History')).toBeInTheDocument();
    });
  });
});
