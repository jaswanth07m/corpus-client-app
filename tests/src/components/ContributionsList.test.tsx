import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ContributionsList,
  PaginationControls,
} from '../../../src/components/ContributionsList';
import type {
  UserContributions,
  ContributionsListProps,
  ContributionItem,
} from '../../../src/components/ContributionsList';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock MediaGridItem
vi.mock('../../../src/components/MediaGridItem', () => ({
  MediaGridItem: ({
    item,
    mediaType,
  }: {
    item: ContributionItem;
    mediaType: string;
  }) => (
    <div data-testid="media-grid-item" data-media-type={mediaType}>
      {item.title}
    </div>
  ),
}));

const mockContributionItem = {
  id: '1',
  size: 1024,
  category_id: 'cat1',
  category_ids: ['cat1'],
  reviewed: true,
  title: 'Test Contribution',
  description: 'Test Description',
  duration: 120,
  timestamp: '2024-01-15T10:00:00Z',
  location: { latitude: 12.9716, longitude: 77.5946 },
  release_rights: 'creator',
  creator: 'Test User',
  language: 'english',
  file_hash: 'abc123',
  snr_frequency: 50,
};

const createMockContributions = (
  overrides: Partial<UserContributions> = {},
): UserContributions => ({
  totalContributions: 100,
  contributionsByType: {
    text: 20,
    audio: 35,
    image: 20,
    video: 15,
    document: 10,
  },
  audioContributions: Array(35)
    .fill(mockContributionItem)
    .map((item, index) => ({
      ...item,
      id: `audio-${index}`,
    })),
  videoContributions: Array(15)
    .fill(mockContributionItem)
    .map((item, index) => ({
      ...item,
      id: `video-${index}`,
    })),
  textContributions: Array(20)
    .fill(mockContributionItem)
    .map((item, index) => ({
      ...item,
      id: `text-${index}`,
    })),
  imageContributions: Array(20)
    .fill(mockContributionItem)
    .map((item, index) => ({
      ...item,
      id: `image-${index}`,
    })),
  documentContributions: Array(10)
    .fill(mockContributionItem)
    .map((item, index) => ({
      ...item,
      id: `doc-${index}`,
    })),
  audioDuration: 1800,
  videoDuration: 3000,
  ...overrides,
});

const createMockProps = (overrides: Partial<ContributionsListProps> = {}) => ({
  contributions: createMockContributions(),
  selectedMediaType: 'audio' as const,
  token: 'test-token',
  isOwnProfile: true,
  ...overrides,
});

describe('ContributionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Null/Empty States', () => {
    it('returns null when contributions is null', () => {
      const { container } = render(
        <ContributionsList {...createMockProps({ contributions: null })} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('returns null when selectedMediaType is null', () => {
      const { container } = render(
        <ContributionsList {...createMockProps({ selectedMediaType: null })} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it('shows message when no audio contributions exist', () => {
      const emptyContributions = createMockContributions({
        audioContributions: [],
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: emptyContributions,
            selectedMediaType: 'audio',
          })}
        />,
      );

      expect(screen.getByText(/No Audio/)).toBeInTheDocument();
    });

    it('shows message when no video contributions exist', () => {
      const emptyContributions = createMockContributions({
        videoContributions: [],
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: emptyContributions,
            selectedMediaType: 'video',
          })}
        />,
      );

      expect(screen.getByText(/No Video/)).toBeInTheDocument();
    });

    it('shows message when no text contributions exist', () => {
      const emptyContributions = createMockContributions({
        textContributions: [],
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: emptyContributions,
            selectedMediaType: 'text',
          })}
        />,
      );

      expect(screen.getByText(/No Text/)).toBeInTheDocument();
    });

    it('shows message when no image contributions exist', () => {
      const emptyContributions = createMockContributions({
        imageContributions: [],
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: emptyContributions,
            selectedMediaType: 'image',
          })}
        />,
      );

      expect(screen.getByText(/No Image/)).toBeInTheDocument();
    });

    it('shows message when no document contributions exist', () => {
      const emptyContributions = createMockContributions({
        documentContributions: [],
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: emptyContributions,
            selectedMediaType: 'document',
          })}
        />,
      );

      expect(screen.getByText(/No Document/)).toBeInTheDocument();
    });
  });

  describe('Media Type Rendering', () => {
    it('renders audio contributions', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'audio' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
      expect(mediaItems[0]).toHaveAttribute('data-media-type', 'audio');
    });

    it('renders video contributions', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'video' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
      expect(mediaItems[0]).toHaveAttribute('data-media-type', 'video');
    });

    it('renders text contributions', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'text' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
      expect(mediaItems[0]).toHaveAttribute('data-media-type', 'text');
    });

    it('renders image contributions', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'image' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
      expect(mediaItems[0]).toHaveAttribute('data-media-type', 'image');
    });

    it('renders document contributions', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'document' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
      expect(mediaItems[0]).toHaveAttribute('data-media-type', 'document');
    });

    it('passes correct props to MediaGridItem', () => {
      render(<ContributionsList {...createMockProps()} />);

      const mediaItems = screen.getAllByTestId('media-grid-item');
      expect(mediaItems.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination', () => {
    it('shows pagination when there are more than 20 items', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'audio' })}
        />,
      );

      // Check for pagination container
      expect(screen.getByText('Prev')).toBeInTheDocument();
    });

    it('hides pagination when there are 20 or fewer items', () => {
      const smallContributions = createMockContributions({
        audioContributions: Array(15).fill(mockContributionItem),
      });

      render(
        <ContributionsList
          {...createMockProps({
            contributions: smallContributions,
            selectedMediaType: 'audio',
          })}
        />,
      );

      expect(screen.queryByText('Prev')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('displays up to 20 items per page', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'audio' })}
        />,
      );

      const mediaItems = screen.getAllByTestId('media-grid-item');
      // First page should have up to 20 items
      expect(mediaItems.length).toBeLessThanOrEqual(20);
      expect(mediaItems.length).toBeGreaterThan(0);
    });

    it('shows different items when navigating to page 2', () => {
      render(
        <ContributionsList
          {...createMockProps({ selectedMediaType: 'audio' })}
        />,
      );

      const nextPageButton = screen.getByText('Next');
      fireEvent.click(nextPageButton);

      const mediaItems = screen.getAllByTestId('media-grid-item');
      // Should show remaining items on page 2
      expect(mediaItems.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Grid Layout', () => {
    it('renders grid with correct CSS classes', () => {
      const { container } = render(
        <ContributionsList {...createMockProps()} />,
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('md:grid-cols-3');
      expect(grid).toHaveClass('lg:grid-cols-4');
      expect(grid).toHaveClass('xl:grid-cols-5');
    });
  });
});

describe('PaginationControls', () => {
  describe('Basic Rendering', () => {
    it('renders pagination controls', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('Prev')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders all page numbers', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('disables Prev button on first page', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const prevButton = screen.getByText('Prev');
      expect(prevButton).toBeDisabled();
    });

    it('disables Next button on last page', () => {
      render(
        <PaginationControls
          currentPage={5}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeDisabled();
    });

    it('highlights current page', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const currentPageButton = screen.getByText('3');
      expect(currentPageButton).toHaveClass('bg-blue-600');
      expect(currentPageButton).toHaveClass('text-white');
    });
  });

  describe('Page Navigation', () => {
    it('calls onPageChange when clicking Next', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when clicking Prev', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      const prevButton = screen.getByText('Prev');
      fireEvent.click(prevButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when clicking page number', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      const pageButton = screen.getByText('3');
      fireEvent.click(pageButton);

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('does not call onPageChange when clicking disabled Prev', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      const prevButton = screen.getByText('Prev');
      fireEvent.click(prevButton);

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('does not call onPageChange when clicking disabled Next', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={5}
          totalPages={5}
          onPageChange={onPageChange}
        />,
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Pagination Logic', () => {
    it('shows ellipsis when near the beginning', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('shows ellipsis when near the end', () => {
      render(
        <PaginationControls
          currentPage={9}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      const ellipsisElements = screen.getAllByText('...');
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });

    it('shows ellipsis in the middle', () => {
      render(
        <PaginationControls
          currentPage={5}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      const ellipsisElements = screen.getAllByText('...');
      expect(ellipsisElements.length).toBe(2);
    });

    it('shows all pages when total pages is 5 or less', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      // Should not show ellipsis
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('shows first page, ellipsis, and last 4 pages when near beginning', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('shows first page, ellipsis, and last pages when near end', () => {
      render(
        <PaginationControls
          currentPage={8}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies correct styles to disabled buttons', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const prevButton = screen.getByText('Prev');
      expect(prevButton).toHaveClass('bg-gray-100');
      expect(prevButton).toHaveClass('text-gray-400');
      expect(prevButton).toHaveClass('cursor-not-allowed');
    });

    it('applies correct styles to enabled buttons', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toHaveClass('bg-white');
      expect(nextButton).toHaveClass('text-gray-700');
    });

    it('applies hover styles to enabled buttons', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toHaveClass('hover:bg-gray-50');
    });

    it('applies correct styles to page number buttons', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const pageButton = screen.getByText('2');
      expect(pageButton).toHaveClass('bg-blue-600');
      expect(pageButton).toHaveClass('text-white');
    });

    it('applies correct styles to inactive page number buttons', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const pageButton = screen.getByText('3');
      expect(pageButton).toHaveClass('bg-white');
      expect(pageButton).toHaveClass('text-gray-700');
    });
  });

  describe('Edge Cases', () => {
    it('handles single page correctly', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={1}
          onPageChange={vi.fn()}
        />,
      );

      // Both Prev and Next should be disabled
      const prevButton = screen.getByText('Prev');
      const nextButton = screen.getByText('Next');
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('handles two pages', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={2}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('handles large number of pages', () => {
      render(
        <PaginationControls
          currentPage={50}
          totalPages={100}
          onPageChange={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('handles page change at boundary (page 1)', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={1}
          totalPages={10}
          onPageChange={onPageChange}
        />,
      );

      const page1Button = screen.getByText('1');
      fireEvent.click(page1Button);

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('handles page change at boundary (last page)', () => {
      const onPageChange = vi.fn();
      render(
        <PaginationControls
          currentPage={10}
          totalPages={10}
          onPageChange={onPageChange}
        />,
      );

      const page10Button = screen.getByText('10');
      fireEvent.click(page10Button);

      expect(onPageChange).toHaveBeenCalledWith(10);
    });
  });

  describe('Responsive Design', () => {
    it('renders with responsive padding classes', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const prevButton = screen.getByText('Prev');
      expect(prevButton).toHaveClass('px-3');
      expect(prevButton).toHaveClass('py-1.5');
      expect(prevButton).toHaveClass('sm:px-4');
      expect(prevButton).toHaveClass('sm:py-2');
    });

    it('renders with responsive gap classes', () => {
      const { container } = render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const controlsDiv = container.firstChild as HTMLElement;
      expect(controlsDiv).toHaveClass('gap-1');
      expect(controlsDiv).toHaveClass('sm:gap-2');
    });

    it('renders with responsive margin classes', () => {
      const { container } = render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const controlsDiv = container.firstChild as HTMLElement;
      expect(controlsDiv).toHaveClass('mt-4');
      expect(controlsDiv).toHaveClass('sm:mt-6');
    });
  });

  describe('Accessibility', () => {
    it('renders buttons with proper roles', () => {
      render(
        <PaginationControls
          currentPage={3}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(2);
    });

    it('has proper disabled state for boundary buttons', () => {
      render(
        <PaginationControls
          currentPage={1}
          totalPages={5}
          onPageChange={vi.fn()}
        />,
      );

      const prevButton = screen.getByRole('button', { name: /prev/i });
      expect(prevButton).toBeDisabled();
    });
  });

  describe('Ellipsis Display Logic', () => {
    it('shows ellipsis after page 4 when current page is 2', () => {
      render(
        <PaginationControls
          currentPage={2}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      const ellipsisElements = screen.getAllByText('...');
      expect(ellipsisElements.length).toBe(1);
    });

    it('shows ellipsis before last pages when current page is near end', () => {
      render(
        <PaginationControls
          currentPage={8}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      const ellipsisElements = screen.getAllByText('...');
      expect(ellipsisElements.length).toBe(1);
    });

    it('shows two ellipsis elements when in middle range', () => {
      render(
        <PaginationControls
          currentPage={5}
          totalPages={10}
          onPageChange={vi.fn()}
        />,
      );

      const ellipsisElements = screen.getAllByText('...');
      expect(ellipsisElements.length).toBe(2);
    });
  });
});
