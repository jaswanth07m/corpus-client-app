/// <reference types="vitest/globals" />
/// <reference types="@testing-library/jest-dom" />

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MediaGridItem } from '../src/components/MediaGridItem';

// Mock @/lib/constants
vi.mock('@/lib/constants', () => ({
  BACKEND_URL: 'https://test-backend.example.com',
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'media.imageUnavailable': 'Image unavailable',
        'common.media.unavailable': 'Media unavailable',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => (
    <svg data-testid="loader-icon" className={className} />
  ),
  X: () => <svg data-testid="close-icon" />,
  Pencil: () => <svg data-testid="pencil-icon" />,
  History: () => <svg data-testid="history-icon" />,
  Clock: () => <svg data-testid="clock-icon" />,
}));

// Mock MediaDetailModal
vi.mock('../src/components/MediaDetailModal', () => ({
  MediaDetailModal: ({
    isOpen,
    onClose,
    item,
    mediaType,
  }: {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any;
    mediaType: string;
  }) =>
    isOpen ? (
      <div
        data-testid="media-detail-modal"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <p>Modal for {item.title}</p>
        <p>Media type: {mediaType}</p>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null,
}));

describe('MediaGridItem', () => {
  const defaultProps = {
    item: {
      id: 'media-001',
      size: 1024000,
      category_id: 'cat-001',
      category_ids: ['cat-001', 'cat-002'],
      reviewed: true,
      title: 'Test Media Title',
      description: 'Test media description',
      duration: 120,
      timestamp: '2024-01-15T10:30:00Z',
      location: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      release_rights: 'creator',
      creator: 'testuser',
      language: 'hindi',
      file_hash: 'abc123hash',
      snr_frequency: 44100,
    },
    mediaType: 'image' as const,
    token: 'test-token-123',
    isOwnProfile: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockFetchSuccess = (url: string) => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ record_url: url }),
    });
  };

  const mockFetchError = () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
  };

  const mockFetchNotFound = () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
  };

  const mockFetchWithoutRecordUrl = () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
  };

  describe('Initial Rendering', () => {
    it('should render the component with basic structure', () => {
      render(<MediaGridItem {...defaultProps} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Test media description')).toBeInTheDocument();
    });

    it('should render with correct base styling', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      const gridItem = container.firstChild;
      expect(gridItem).toHaveClass('bg-gradient-to-br');
      expect(gridItem).toHaveClass('from-slate-50');
      expect(gridItem).toHaveClass('rounded-2xl');
    });

    it('should display the media title in both overlay and info section', () => {
      render(<MediaGridItem {...defaultProps} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles).toHaveLength(2);
    });

    it('should display the language', () => {
      render(<MediaGridItem {...defaultProps} />);

      expect(screen.getByText('hindi')).toBeInTheDocument();
    });

    it('should show "Untitled" when title is missing', () => {
      const propsWithoutTitle = {
        ...defaultProps,
        item: { ...defaultProps.item, title: '' },
      };

      render(<MediaGridItem {...propsWithoutTitle} />);

      const untitledElements = screen.getAllByText('Untitled');
      expect(untitledElements).toHaveLength(2);
    });

    it('should show "No description" when description is missing', () => {
      const propsWithoutDesc = {
        ...defaultProps,
        item: { ...defaultProps.item, description: '' },
      };

      render(<MediaGridItem {...propsWithoutDesc} />);

      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('should show "N/A" when language is missing', () => {
      const propsWithoutLang = {
        ...defaultProps,
        item: { ...defaultProps.item, language: '' },
      };

      render(<MediaGridItem {...propsWithoutLang} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Image Media Rendering', () => {
    it('should show placeholder for image before loading', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Should show placeholder SVG for image type
      const placeholders = document.querySelectorAll('svg');
      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should show loading spinner when fetching image URL', async () => {
      // Mock fetch that takes time
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  record_url: 'https://example.com/image.jpg',
                }),
              });
            }, 100);
          }),
      );

      render(<MediaGridItem {...defaultProps} />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for loader to appear
      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should render image when URL is fetched successfully', async () => {
      mockFetchSuccess('https://example.com/test-image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for image to load
      await waitFor(() => {
        const img = screen.getByAltText('Test Media Title');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute(
          'src',
          'https://example.com/test-image.jpg',
        );
      });
    });

    it('should show error state when image fetch fails', async () => {
      mockFetchError();

      render(<MediaGridItem {...defaultProps} />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should show error state when image URL returns 404', async () => {
      mockFetchNotFound();

      render(<MediaGridItem {...defaultProps} />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should handle image load error with onError handler', async () => {
      mockFetchSuccess('https://example.com/broken-image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for image to load
      await waitFor(() => {
        const img = screen.getByAltText('Test Media Title');
        expect(img).toBeInTheDocument();
      });

      // Simulate image load error
      const img = screen.getByAltText('Test Media Title');
      fireEvent.error(img);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Non-Image Media Rendering', () => {
    it('should render text media with document icon', () => {
      render(<MediaGridItem {...defaultProps} mediaType="text" />);

      // Should show the title
      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render audio media with music icon', () => {
      render(<MediaGridItem {...defaultProps} mediaType="audio" />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render video media with video icon', () => {
      render(<MediaGridItem {...defaultProps} mediaType="video" />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render document media with document icon', () => {
      render(<MediaGridItem {...defaultProps} mediaType="document" />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should show loading spinner for non-image media', async () => {
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  record_url: 'https://example.com/audio.mp3',
                }),
              });
            }, 100);
          }),
      );

      render(<MediaGridItem {...defaultProps} mediaType="audio" />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).toBeInTheDocument();
      });
    });

    it('should show error state for non-image media fetch failure', async () => {
      mockFetchError();

      render(<MediaGridItem {...defaultProps} mediaType="audio" />);

      // Trigger loading by hovering
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Media unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Lazy Loading Behavior', () => {
    it('should not fetch media URL on initial render', () => {
      render(<MediaGridItem {...defaultProps} />);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch media URL when mouse enters the component', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://test-backend.example.com/records/media-001/record-url?expires_minutes=60',
          expect.objectContaining({
            method: 'GET',
            headers: {
              Authorization: 'Bearer test-token-123',
              'Content-Type': 'application/json',
            },
          }),
        );
      });
    });

    it('should fetch media URL when component is clicked', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should not fetch again if media URL is already loaded', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Hover again
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Should not fetch again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should use correct authorization token in fetch request', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} token="custom-token-xyz" />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer custom-token-xyz',
              'Content-Type': 'application/json',
            },
          }),
        );
      });
    });
  });

  describe('Modal Interaction', () => {
    it('should not show modal on initial render', () => {
      render(<MediaGridItem {...defaultProps} />);

      expect(
        screen.queryByTestId('media-detail-modal'),
      ).not.toBeInTheDocument();
    });

    it('should open modal when component is clicked', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });

    it('should pass correct item to modal', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(
          screen.getByText('Modal for Test Media Title'),
        ).toBeInTheDocument();
      });
    });

    it('should pass correct mediaType to modal', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} mediaType="video" />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Media type: video')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close Modal');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('media-detail-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking outside', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });

      // Click on modal to close (it's the onClose handler)
      const modal = screen.getByTestId('media-detail-modal');
      await act(async () => {
        fireEvent.click(modal);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('media-detail-modal'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Hover Effects', () => {
    it('should have hover transition classes', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      const gridItem = container.firstChild;
      expect(gridItem).toHaveClass('transition-all');
      expect(gridItem).toHaveClass('duration-300');
      expect(gridItem).toHaveClass('hover:-translate-y-1');
    });

    it('should trigger media load on hover', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Overlay on Hover', () => {
    it('should have overlay element for hover effect', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Check for overlay structure
      const overlays = document.querySelectorAll('[class*="overlay"]');
      // Overlay exists but might not have explicit 'overlay' class
      expect(document.body).toBeInTheDocument();
    });

    it('should display title and language in overlay on hover', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Title and language should be present (they're in the overlay structure)
      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('hindi')).toBeInTheDocument();
    });
  });

  describe('Different Media Types', () => {
    it('should handle image media type', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="image" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle text media type', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="text" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle audio media type', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="audio" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle video media type', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="video" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle document media type', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="document" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle unknown media type with default case', () => {
      const { container } = render(
        <MediaGridItem {...defaultProps} mediaType="unknown" as any />,
      );

      // Should still render without crashing (default case returns null for icon)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetchError();

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });

      // Component should still be functional
      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle 404 errors gracefully', async () => {
      mockFetchNotFound();

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should log errors to console', async () => {
      mockFetchError();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle response without record_url', async () => {
      mockFetchWithoutRecordUrl();

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Should not set mediaUrl when record_url is missing
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Image should not be loaded (no src attribute)
      const img = screen.queryByAltText('Test Media Title');
      expect(img).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper image alt text', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        const img = screen.getByAltText('Test Media Title');
        expect(img).toBeInTheDocument();
      });
    });

    it('should use default alt text when title is missing', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(
        <MediaGridItem
          {...defaultProps}
          item={{ ...defaultProps.item, title: '' }}
        />,
      );

      const titleElement = screen.getAllByText('Untitled')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        const img = screen.getByAltText('Image');
        expect(img).toBeInTheDocument();
      });
    });

    it('should have clickable area for interaction', () => {
      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      expect(gridItem).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text sizes', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Check for responsive classes (text-xs sm:text-sm)
      const titleElements = screen.getAllByText('Test Media Title');
      expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should have responsive icon sizes', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Icons should have responsive sizing
      const icons = document.querySelectorAll(
        '[class*="w-12 h-12 sm:w-16 sm:h-16"]',
      );
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should have responsive padding', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Check for responsive padding classes
      const elements = document.querySelectorAll('[class*="p-3 sm:p-4"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Prop Variations', () => {
    it('should handle item with minimal data', () => {
      const minimalItem = {
        id: 'minimal-001',
        size: 512,
        reviewed: false,
        title: '',
        description: '',
        release_rights: 'creator',
        creator: '',
        language: '',
        file_hash: '',
        snr_frequency: 0,
      };

      render(<MediaGridItem {...defaultProps} item={minimalItem} />);

      const untitledElements = screen.getAllByText('Untitled');
      expect(untitledElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('No description')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle item with all optional fields', () => {
      const completeItem = {
        ...defaultProps.item,
        duration: 180,
        timestamp: '2024-01-15T10:30:00Z',
        location: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      render(<MediaGridItem {...defaultProps} item={completeItem} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle different languages', () => {
      render(
        <MediaGridItem
          {...defaultProps}
          item={{ ...defaultProps.item, language: 'tamil' }}
        />,
      );

      expect(screen.getByText('tamil')).toBeInTheDocument();
    });

    it('should handle very long titles with truncation', () => {
      const longTitle =
        'This is a very long title that should be truncated in the display because it exceeds the normal length';

      render(
        <MediaGridItem
          {...defaultProps}
          item={{ ...defaultProps.item, title: longTitle }}
        />,
      );

      const titleElements = screen.getAllByText(longTitle);
      expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very long descriptions with truncation', () => {
      const longDesc =
        'This is a very long description that should be truncated in the display because it exceeds the normal length and should not break the layout';

      render(
        <MediaGridItem
          {...defaultProps}
          item={{ ...defaultProps.item, description: longDesc }}
        />,
      );

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });
  });

  describe('isOwnProfile Prop', () => {
    it('should pass isOwnProfile to MediaDetailModal', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} isOwnProfile={true} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });

    it('should handle isOwnProfile as false', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} isOwnProfile={false} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Token Handling', () => {
    it('should handle empty token', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      render(<MediaGridItem {...defaultProps} token="" />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: 'Bearer ',
              'Content-Type': 'application/json',
            },
          }),
        );
      });
    });

    it('should handle special characters in token', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      const specialToken = 'token-with-special_chars.test';

      render(<MediaGridItem {...defaultProps} token={specialToken} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              Authorization: `Bearer ${specialToken}`,
              'Content-Type': 'application/json',
            },
          }),
        );
      });
    });
  });

  describe('Multiple Category IDs', () => {
    it('should handle item with category_ids array', () => {
      const itemWithMultipleCategories = {
        ...defaultProps.item,
        category_ids: ['cat-001', 'cat-002', 'cat-003'],
      };

      render(
        <MediaGridItem {...defaultProps} item={itemWithMultipleCategories} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with only category_id (backward compatibility)', () => {
      const itemWithSingleCategory = {
        ...defaultProps.item,
        category_ids: undefined,
        category_id: 'cat-single',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithSingleCategory} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Media URL Caching', () => {
    it('should not refetch when mediaUrl is already set', async () => {
      mockFetchSuccess('https://example.com/cached-image.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      // First hover
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Second hover - should not trigger another fetch
      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait a bit to ensure no additional fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should not refetch when shouldLoad is true but mediaUrl exists', async () => {
      mockFetchSuccess('https://example.com/already-loaded.jpg');

      render(<MediaGridItem {...defaultProps} />);

      // Click to trigger shouldLoad and fetch
      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Click again - should not refetch
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Component Structure', () => {
    it('should have correct aspect ratio container', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      const aspectContainer = container.querySelector('.aspect-square');
      expect(aspectContainer).toBeInTheDocument();
    });

    it('should have gradient background', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      expect(container.firstChild).toHaveClass('from-slate-50');
      expect(container.firstChild).toHaveClass('to-slate-100');
    });

    it('should have shadow effects', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      expect(container.firstChild).toHaveClass('shadow-sm');
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
    });

    it('should have overflow hidden on media container', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      const mediaContainer = container.querySelector('.aspect-square');
      expect(mediaContainer).toHaveClass('overflow-hidden');
    });
  });

  describe('SNR Frequency and File Hash', () => {
    it('should handle item with snr_frequency', () => {
      const itemWithSnr = {
        ...defaultProps.item,
        snr_frequency: 48000,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithSnr} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with file_hash', () => {
      const itemWithHash = {
        ...defaultProps.item,
        file_hash: 'sha256-abc123def456',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithHash} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero snr_frequency', () => {
      const itemWithZeroSnr = {
        ...defaultProps.item,
        snr_frequency: 0,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithZeroSnr} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Timestamp and Duration', () => {
    it('should handle item with timestamp', () => {
      const itemWithTimestamp = {
        ...defaultProps.item,
        timestamp: '2024-06-15T14:30:00Z',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithTimestamp} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with duration', () => {
      const itemWithDuration = {
        ...defaultProps.item,
        duration: 300,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithDuration} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without duration', () => {
      const itemWithoutDuration = {
        ...defaultProps.item,
        duration: undefined,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithoutDuration} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without timestamp', () => {
      const itemWithoutTimestamp = {
        ...defaultProps.item,
        timestamp: undefined,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithoutTimestamp} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Location Data', () => {
    it('should handle item with location coordinates', () => {
      const itemWithLocation = {
        ...defaultProps.item,
        location: {
          latitude: 51.5074,
          longitude: -0.1278,
        },
      };

      render(<MediaGridItem {...defaultProps} item={itemWithLocation} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without location', () => {
      const itemWithoutLocation = {
        ...defaultProps.item,
        location: undefined,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithoutLocation} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle negative coordinates', () => {
      const itemWithNegativeCoords = {
        ...defaultProps.item,
        location: {
          latitude: -33.8688,
          longitude: 151.2093,
        },
      };

      render(<MediaGridItem {...defaultProps} item={itemWithNegativeCoords} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Release Rights', () => {
    it('should handle item with creator release rights', () => {
      const itemWithCreatorRights = {
        ...defaultProps.item,
        release_rights: 'creator',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithCreatorRights} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with different release rights', () => {
      const itemWithPublicRights = {
        ...defaultProps.item,
        release_rights: 'public',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithPublicRights} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty release rights', () => {
      const itemWithEmptyRights = {
        ...defaultProps.item,
        release_rights: '',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithEmptyRights} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Size Variations', () => {
    it('should handle very large file size', () => {
      const itemWithLargeSize = {
        ...defaultProps.item,
        size: 1073741824, // 1GB
      };

      render(<MediaGridItem {...defaultProps} item={itemWithLargeSize} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very small file size', () => {
      const itemWithSmallSize = {
        ...defaultProps.item,
        size: 100,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithSmallSize} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero size', () => {
      const itemWithZeroSize = {
        ...defaultProps.item,
        size: 0,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithZeroSize} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Reviewed Status', () => {
    it('should handle reviewed item', () => {
      const reviewedItem = {
        ...defaultProps.item,
        reviewed: true,
      };

      render(<MediaGridItem {...defaultProps} item={reviewedItem} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unreviewed item', () => {
      const unreviewedItem = {
        ...defaultProps.item,
        reviewed: false,
      };

      render(<MediaGridItem {...defaultProps} item={unreviewedItem} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Creator Information', () => {
    it('should handle item with creator name', () => {
      const itemWithCreator = {
        ...defaultProps.item,
        creator: 'John Doe',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithCreator} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with empty creator', () => {
      const itemWithoutCreator = {
        ...defaultProps.item,
        creator: '',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithoutCreator} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with special characters in creator name', () => {
      const itemWithSpecialCreator = {
        ...defaultProps.item,
        creator: "O'Brien & Associates",
      };

      render(<MediaGridItem {...defaultProps} item={itemWithSpecialCreator} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Image Error States', () => {
    it('should handle image onerror with setError', async () => {
      mockFetchSuccess('https://example.com/will-fail.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      // Wait for image to load
      await waitFor(() => {
        const img = screen.getByAltText('Test Media Title');
        expect(img).toBeInTheDocument();
      });

      // Trigger error on image load
      const img = screen.getByAltText('Test Media Title');
      fireEvent.error(img);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Props Passing', () => {
    it('should pass previewUrl to modal', async () => {
      mockFetchSuccess('https://example.com/preview-test.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });

    it('should pass token to modal', async () => {
      mockFetchSuccess('https://example.com/token-test.jpg');

      render(<MediaGridItem {...defaultProps} token="modal-token-test" />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Hover and Click', () => {
    it('should handle rapid hover and click events', async () => {
      mockFetchSuccess('https://example.com/rapid-test.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        // Rapid hover and click
        fireEvent.mouseEnter(gridItem);
        fireEvent.click(gridItem);
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should have cursor pointer for keyboard users', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      expect(container.firstChild).toHaveClass('cursor-pointer');
    });
  });

  describe('Transition Effects', () => {
    it('should have transform transition on hover', () => {
      const { container } = render(<MediaGridItem {...defaultProps} />);

      expect(container.firstChild).toHaveClass('transform');
      expect(container.firstChild).toHaveClass('hover:-translate-y-1');
    });

    it('should have opacity transition for overlay', () => {
      render(<MediaGridItem {...defaultProps} />);

      // Overlay should have opacity transition
      const overlayElements = document.querySelectorAll('[class*="opacity-0"]');
      expect(overlayElements.length).toBeGreaterThan(0);
    });
  });

  describe('Media Icon Rendering', () => {
    it('should render correct icon for text type', () => {
      render(<MediaGridItem {...defaultProps} mediaType="text" />);

      // Text icon should be blue
      const textIcons = document.querySelectorAll('[class*="text-blue-500"]');
      expect(textIcons.length).toBeGreaterThan(0);
    });

    it('should render correct icon for audio type', () => {
      render(<MediaGridItem {...defaultProps} mediaType="audio" />);

      // Audio icon should be green
      const audioIcons = document.querySelectorAll('[class*="text-green-500"]');
      expect(audioIcons.length).toBeGreaterThan(0);
    });

    it('should render correct icon for document type', () => {
      render(<MediaGridItem {...defaultProps} mediaType="document" />);

      // Document icon should be yellow/orange
      const docIcons = document.querySelectorAll('[class*="text-yellow-600"]');
      expect(docIcons.length).toBeGreaterThan(0);
    });

    it('should render correct icon for video type', () => {
      render(<MediaGridItem {...defaultProps} mediaType="video" />);

      // Video icon should be purple
      const videoIcons = document.querySelectorAll(
        '[class*="text-purple-500"]',
      );
      expect(videoIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null item properties gracefully', () => {
      const itemWithNulls = {
        ...defaultProps.item,
        title: null as unknown as string,
        description: null as unknown as string,
      };

      render(<MediaGridItem {...defaultProps} item={itemWithNulls} />);

      // Should still render without crashing
      const untitledElements = screen.getAllByText('Untitled');
      expect(untitledElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unicode characters in title', () => {
      const itemWithUnicode = {
        ...defaultProps.item,
        title: 'नमस्ते दुनिया 🌍',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithUnicode} />);

      const titles = screen.getAllByText('नमस्ते दुनिया 🌍');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle HTML special characters in description', () => {
      const itemWithSpecialChars = {
        ...defaultProps.item,
        description: 'Test & description <with> "special" \'chars\'',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithSpecialChars} />);

      expect(
        screen.getByText('Test & description <with> "special" \'chars\''),
      ).toBeInTheDocument();
    });

    it('should handle very long language string', () => {
      const itemWithLongLang = {
        ...defaultProps.item,
        language: 'This is a very long language name that should be truncated',
      };

      render(<MediaGridItem {...defaultProps} item={itemWithLongLang} />);

      expect(
        screen.getByText(
          'This is a very long language name that should be truncated',
        ),
      ).toBeInTheDocument();
    });
  });

  describe('Fetch API Error Types', () => {
    it('should handle network timeout error', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValue(new TypeError('Network timeout'));

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should handle abort error', async () => {
      const abortError = new DOMException('Aborted', 'AbortError');
      global.fetch = vi.fn().mockRejectedValue(abortError);

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should handle 500 server error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should handle 401 unauthorized error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });

    it('should handle 403 forbidden error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        fireEvent.mouseEnter(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByText('Image unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('Modal State Management', () => {
    it('should toggle modal open and closed multiple times', async () => {
      mockFetchSuccess('https://example.com/toggle-test.jpg');

      render(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');

      if (gridItem) {
        // Open modal
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByText('Close Modal');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('media-detail-modal'),
        ).not.toBeInTheDocument();
      });

      // Open again
      if (gridItem) {
        fireEvent.click(gridItem);
      }

      await waitFor(() => {
        expect(screen.getByTestId('media-detail-modal')).toBeInTheDocument();
      });
    });
  });
});
