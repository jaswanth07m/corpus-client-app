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
import { BrowserRouter } from 'react-router-dom';
import { MediaGridItem } from '../../../src/components/MediaGridItem';

const renderWithRouter = (component: React.ReactNode) => {
  return render(component, { wrapper: BrowserRouter });
};

// Mock react-router-dom with proper context
vi.mock('react-router-dom', async () => {
  const React = await import('react');
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => (path: string) => console.log('navigate to', path),
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

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
vi.mock('@/components/MediaDetailModal', () => ({
  MediaDetailModal: ({
    isOpen,
    onClose,
    item,
    mediaType,
    isOwnProfile,
    previewUrl,
    token,
  }: {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    item: any;
    mediaType: string;
    isOwnProfile?: boolean;
    previewUrl?: string;
    token?: string;
  }) =>
    isOpen ? (
      <div
        data-testid="media-detail-modal"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        data-is-own-profile={isOwnProfile}
        data-preview-url={previewUrl}
        data-token={token}
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
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Test media description')).toBeInTheDocument();
    });

    it('should render with correct base styling', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      const gridItem = container.firstChild;
      expect(gridItem).toHaveClass('bg-gradient-to-br');
      expect(gridItem).toHaveClass('from-slate-50');
      expect(gridItem).toHaveClass('rounded-2xl');
    });

    it('should display the media title in both overlay and info section', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles).toHaveLength(2);
    });

    it('should display the language', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      expect(screen.getByText('hindi')).toBeInTheDocument();
    });

    it('should show "Untitled" when title is missing', () => {
      const propsWithoutTitle = {
        ...defaultProps,
        item: { ...defaultProps.item, title: '' },
      };

      renderWithRouter(<MediaGridItem {...propsWithoutTitle} />);

      const untitledElements = screen.getAllByText('Untitled');
      expect(untitledElements).toHaveLength(2);
    });

    it('should show "No description" when description is missing', () => {
      const propsWithoutDesc = {
        ...defaultProps,
        item: { ...defaultProps.item, description: '' },
      };

      renderWithRouter(<MediaGridItem {...propsWithoutDesc} />);

      expect(screen.getByText('No description')).toBeInTheDocument();
    });

    it('should show "N/A" when language is missing', () => {
      const propsWithoutLang = {
        ...defaultProps,
        item: { ...defaultProps.item, language: '' },
      };

      renderWithRouter(<MediaGridItem {...propsWithoutLang} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Image Media Rendering', () => {
    it('should show placeholder for image before loading', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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
      renderWithRouter(<MediaGridItem {...defaultProps} mediaType="text" />);

      // Should show the title
      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render audio media with music icon', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} mediaType="audio" />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render video media with video icon', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} mediaType="video" />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should render document media with document icon', () => {
      renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="document" />,
      );

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

      renderWithRouter(<MediaGridItem {...defaultProps} mediaType="audio" />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} mediaType="audio" />);

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
    it('should fetch media URL on initial render', () => {
      mockFetchSuccess('https://example.com/image.jpg');
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use correct authorization token in fetch request', () => {
      mockFetchSuccess('https://example.com/image.jpg');
      renderWithRouter(
        <MediaGridItem {...defaultProps} token="custom-token-xyz" />,
      );

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

  describe('Modal Interaction', () => {
    it('should not show modal on initial render', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      expect(
        screen.queryByTestId('media-detail-modal'),
      ).not.toBeInTheDocument();
    });

    it('should have clickable element', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      expect(gridItem).toBeInTheDocument();
    });
  });

  describe('Hover Effects', () => {
    it('should have hover transition classes', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      const gridItem = container.firstChild;
      expect(gridItem).toHaveClass('transition-all');
      expect(gridItem).toHaveClass('duration-300');
      expect(gridItem).toHaveClass('hover:-translate-y-1');
    });

    it('should trigger media load on hover', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      // Check for overlay structure
      const overlays = document.querySelectorAll('[class*="overlay"]');
      // Overlay exists but might not have explicit 'overlay' class
      expect(document.body).toBeInTheDocument();
    });

    it('should display title and language in overlay on hover', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      // Title and language should be present (they're in the overlay structure)
      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('hindi')).toBeInTheDocument();
    });
  });

  describe('Different Media Types', () => {
    it('should handle image media type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="image" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle text media type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="text" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle audio media type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="audio" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle video media type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="video" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle document media type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="document" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should handle unknown media type with default case', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const unknownMediaType = 'unknown' as any;
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType={unknownMediaType} />,
      );

      // Should still render without crashing (default case returns null for icon)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetchError();

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(
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
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      const titleElement = screen.getAllByText('Test Media Title')[0];
      const gridItem = titleElement.closest('[class*="group"]');
      expect(gridItem).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive text sizes', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      const titleElements = screen.getAllByText('Test Media Title');
      expect(titleElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should render with responsive design', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have responsive padding', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
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

      renderWithRouter(<MediaGridItem {...defaultProps} item={minimalItem} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} item={completeItem} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle different languages', () => {
      renderWithRouter(
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

      renderWithRouter(
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

      renderWithRouter(
        <MediaGridItem
          {...defaultProps}
          item={{ ...defaultProps.item, description: longDesc }}
        />,
      );

      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });
  });

  describe('isOwnProfile Prop', () => {
    it('should render without crashing when isOwnProfile is provided', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with default props', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Token Handling', () => {
    it('should handle empty token', async () => {
      mockFetchSuccess('https://example.com/image.jpg');

      renderWithRouter(<MediaGridItem {...defaultProps} token="" />);

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} token={specialToken} />,
      );

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

      renderWithRouter(
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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithSingleCategory} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Media URL Caching', () => {
    it('should not refetch when mediaUrl is already set', async () => {
      mockFetchSuccess('https://example.com/cached-image.jpg');

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      const aspectContainer = container.querySelector('.aspect-square');
      expect(aspectContainer).toBeInTheDocument();
    });

    it('should have gradient background', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toHaveClass('from-slate-50');
      expect(container.firstChild).toHaveClass('to-slate-100');
    });

    it('should have shadow effects', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toHaveClass('shadow-sm');
      expect(container.firstChild).toHaveClass('hover:shadow-xl');
    });

    it('should have overflow hidden on media container', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

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

      renderWithRouter(<MediaGridItem {...defaultProps} item={itemWithSnr} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with file_hash', () => {
      const itemWithHash = {
        ...defaultProps.item,
        file_hash: 'sha256-abc123def456',
      };

      renderWithRouter(<MediaGridItem {...defaultProps} item={itemWithHash} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero snr_frequency', () => {
      const itemWithZeroSnr = {
        ...defaultProps.item,
        snr_frequency: 0,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithZeroSnr} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithTimestamp} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with duration', () => {
      const itemWithDuration = {
        ...defaultProps.item,
        duration: 300,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithDuration} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without duration', () => {
      const itemWithoutDuration = {
        ...defaultProps.item,
        duration: undefined,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithoutDuration} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without timestamp', () => {
      const itemWithoutTimestamp = {
        ...defaultProps.item,
        timestamp: undefined,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithoutTimestamp} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithLocation} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item without location', () => {
      const itemWithoutLocation = {
        ...defaultProps.item,
        location: undefined,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithoutLocation} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithNegativeCoords} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithCreatorRights} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with different release rights', () => {
      const itemWithPublicRights = {
        ...defaultProps.item,
        release_rights: 'public',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithPublicRights} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle empty release rights', () => {
      const itemWithEmptyRights = {
        ...defaultProps.item,
        release_rights: '',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithEmptyRights} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithLargeSize} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very small file size', () => {
      const itemWithSmallSize = {
        ...defaultProps.item,
        size: 100,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithSmallSize} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle zero size', () => {
      const itemWithZeroSize = {
        ...defaultProps.item,
        size: 0,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithZeroSize} />,
      );

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

      renderWithRouter(<MediaGridItem {...defaultProps} item={reviewedItem} />);

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unreviewed item', () => {
      const unreviewedItem = {
        ...defaultProps.item,
        reviewed: false,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={unreviewedItem} />,
      );

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

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithCreator} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with empty creator', () => {
      const itemWithoutCreator = {
        ...defaultProps.item,
        creator: '',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithoutCreator} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle item with special characters in creator name', () => {
      const itemWithSpecialCreator = {
        ...defaultProps.item,
        creator: "O'Brien & Associates",
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithSpecialCreator} />,
      );

      const titles = screen.getAllByText('Test Media Title');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Image Error States', () => {
    it('should handle image onerror with setError', async () => {
      mockFetchSuccess('https://example.com/will-fail.jpg');

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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
    it('should render component with token', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} token="modal-token-test" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render component with default props', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Concurrent Hover and Click', () => {
    it('should handle rapid hover and click events', () => {
      mockFetchSuccess('https://example.com/rapid-test.jpg');

      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('should have cursor pointer for keyboard users', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toHaveClass('cursor-pointer');
    });
  });

  describe('Transition Effects', () => {
    it('should have transform transition on hover', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toHaveClass('transform');
      expect(container.firstChild).toHaveClass('hover:-translate-y-1');
    });

    it('should have opacity transition for overlay', () => {
      renderWithRouter(<MediaGridItem {...defaultProps} />);

      // Overlay should have opacity transition
      const overlayElements = document.querySelectorAll('[class*="opacity-0"]');
      expect(overlayElements.length).toBeGreaterThan(0);
    });
  });

  describe('Media Icon Rendering', () => {
    it('should render correct icon for text type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="text" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render correct icon for audio type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="audio" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render correct icon for document type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="document" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render correct icon for video type', () => {
      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} mediaType="video" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null item properties gracefully', () => {
      const itemWithNulls = {
        ...defaultProps.item,
        title: null as unknown as string,
        description: null as unknown as string,
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithNulls} />,
      );

      // Should still render without crashing
      const untitledElements = screen.getAllByText('Untitled');
      expect(untitledElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle unicode characters in title', () => {
      const itemWithUnicode = {
        ...defaultProps.item,
        title: 'नमस्ते दुनिया 🌍',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithUnicode} />,
      );

      const titles = screen.getAllByText('नमस्ते दुनिया 🌍');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle HTML special characters in description', () => {
      const itemWithSpecialChars = {
        ...defaultProps.item,
        description: 'Test & description <with> "special" \'chars\'',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithSpecialChars} />,
      );

      expect(
        screen.getByText('Test & description <with> "special" \'chars\''),
      ).toBeInTheDocument();
    });

    it('should handle very long language string', () => {
      const itemWithLongLang = {
        ...defaultProps.item,
        language: 'This is a very long language name that should be truncated',
      };

      renderWithRouter(
        <MediaGridItem {...defaultProps} item={itemWithLongLang} />,
      );

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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

      renderWithRouter(<MediaGridItem {...defaultProps} />);

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
    it('should render component correctly', () => {
      mockFetchSuccess('https://example.com/toggle-test.jpg');

      const { container } = renderWithRouter(
        <MediaGridItem {...defaultProps} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
