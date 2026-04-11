import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import UserContributions from '../../../src/components/UserContributions';
import { BACKEND_URL } from '../../../src/lib/constants';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'stats.contributions': ' contributions',
        'stats.contributionsFound': ' contributions found',
        'messages.errorLoadingContributions': 'Error loading contributions: ',
        'messages.loading': 'Loading...',
        'common.': ')',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserContributions', () => {
  const mockProps = {
    userId: 'user-123',
    mediaType: 'text' as const,
    authToken: 'mock-auth-token',
  };

  const mockContributions = [
    {
      id: '1',
      size: 1024,
      category_id: 'cat-1',
      reviewed: true,
      title: 'Contribution 1',
    },
    {
      id: '2',
      size: 2048,
      category_id: 'cat-2',
      reviewed: false,
      title: 'Contribution 2',
    },
    {
      id: '3',
      size: 512,
      category_id: 'cat-1',
      reviewed: true,
      title: 'Contribution 3',
    },
  ];

  const mockApiResponse = {
    user_id: 'user-123',
    total_contributions: 3,
    contributions: mockContributions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders component with provided props', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      expect(
        screen.getByText(/Loading text contributions/i),
      ).toBeInTheDocument();
    });

    it('displays loading state initially', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      expect(
        screen.getByText(/Loading text contributions/i),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
      });
    });

    it('displays correct media type in loading message for audio', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} mediaType="audio" />);

      expect(
        screen.getByText(/Loading audio contributions/i),
      ).toBeInTheDocument();
    });

    it('displays correct media type in loading message for video', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} mediaType="video" />);

      expect(
        screen.getByText(/Loading video contributions/i),
      ).toBeInTheDocument();
    });

    it('displays correct media type in loading message for image', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} mediaType="image" />);

      expect(
        screen.getByText(/Loading image contributions/i),
      ).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when API call fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading contributions:/i),
        ).toBeInTheDocument();
      });
      expect(screen.getByText(/HTTP error! status: 500/i)).toBeInTheDocument();
    });

    it('displays error message for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading contributions:/i),
        ).toBeInTheDocument();
      });
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    it('handles generic errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/Error loading contributions:/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows no contributions message when contributions array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 0,
          contributions: [],
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No text contributions found/i),
        ).toBeInTheDocument();
      });
    });

    it('shows empty state for different media types', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 0,
          contributions: [],
        }),
      });

      render(<UserContributions {...mockProps} mediaType="audio" />);

      await waitFor(() => {
        expect(
          screen.getByText(/No audio contributions found/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Rendering', () => {
    it('renders contributions list correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Contribution 1')).toBeInTheDocument();
        expect(screen.getByText('Contribution 2')).toBeInTheDocument();
        expect(screen.getByText('Contribution 3')).toBeInTheDocument();
      });
    });

    it('displays correct count badge with displayed/total items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('(3 of 3)')).toBeInTheDocument();
      });
    });

    it('renders contribution header with capitalized media type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} mediaType="audio" />);

      await waitFor(() => {
        expect(screen.getByText('Audio Contributions')).toBeInTheDocument();
      });
    });

    it('renders each contribution item with proper structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toBeInTheDocument();
        const listItems = screen.getAllByRole('listitem');
        expect(listItems).toHaveLength(3);
      });
    });
  });

  describe('Contribution Status Display', () => {
    it('shows Reviewed status for reviewed contributions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { container } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const reviewedElement = container.querySelector(
          '.contribution-status.reviewed',
        );
        expect(reviewedElement?.textContent).toMatch(/Reviewed/);
      });
    });

    it('shows Upload Success status for non-reviewed contributions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { container } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const uploadedElement = container.querySelector(
          '.contribution-status.uploaded',
        );
        expect(uploadedElement?.textContent).toMatch(/Upload Success/);
      });
    });

    it('applies correct CSS class for reviewed status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { container } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const reviewedElement = container.querySelector(
          '.contribution-status.reviewed',
        );
        expect(reviewedElement).toBeInTheDocument();
        expect(reviewedElement?.textContent).toContain('✓ Reviewed');
      });
    });

    it('applies correct CSS class for uploaded status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { container } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const uploadedElement = container.querySelector(
          '.contribution-status.uploaded',
        );
        expect(uploadedElement).toBeInTheDocument();
        expect(uploadedElement?.textContent).toContain('✓ Upload Success');
      });
    });
  });

  describe('Load More Functionality', () => {
    const generateContributions = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `contrib-${i + 1}`,
        size: 1024 * (i + 1),
        category_id: `cat-${(i % 3) + 1}`,
        reviewed: i % 2 === 0,
        title: `Contribution ${i + 1}`,
      }));
    };

    it('shows Load More button when there are more items', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More (5 remaining)')).toBeInTheDocument();
      });
    });

    it('hides Load More button when all items are displayed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.queryByText(/Load More/i)).not.toBeInTheDocument();
      });
    });

    it('clicking Load More appends more items', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Contribution 1')).toBeInTheDocument();
        expect(screen.getByText('Load More (5 remaining)')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText('Load More (5 remaining)');
      fireEvent.click(loadMoreButton);

      // After clicking, all 25 items should be displayed (no more remaining)
      await waitFor(
        () => {
          expect(screen.queryByText(/Load More/i)).not.toBeInTheDocument();
        },
        { timeout: 2000 },
      );
    });

    it('button shows loading state while loading more', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More (5 remaining)')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByRole('button', {
        name: /Load More \(5 remaining\)/i,
      });
      fireEvent.click(loadMoreButton);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(loadMoreButton).toBeDisabled();
    });

    it('Load More button has correct CSS class', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Load More/i });
        expect(button).toHaveClass('load-more-button');
      });
    });
  });

  describe('Pagination Logic', () => {
    const generateContributions = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `contrib-${i + 1}`,
        size: 1024 * (i + 1),
        category_id: `cat-${(i % 3) + 1}`,
        reviewed: i % 2 === 0,
        title: `Contribution ${i + 1}`,
      }));
    };

    it('items per page is 20', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('(20 of 25)')).toBeInTheDocument();
      });
    });

    it('each load more fetches next 20 items', async () => {
      const manyContributions = generateContributions(45);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 45,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('(20 of 45)')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText('Load More (25 remaining)');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('(40 of 45)')).toBeInTheDocument();
      });
    });

    it('correct slicing of allContributions array', async () => {
      const manyContributions = generateContributions(25);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 25,
          contributions: manyContributions,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Contribution 1')).toBeInTheDocument();
        expect(screen.getByText('Contribution 20')).toBeInTheDocument();
        expect(screen.queryByText('Contribution 21')).not.toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText('Load More (5 remaining)');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Contribution 21')).toBeInTheDocument();
        expect(screen.getByText('Contribution 25')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('component does not fetch without userId', () => {
      render(
        <UserContributions
          userId=""
          mediaType={mockProps.mediaType}
          authToken={mockProps.authToken}
        />,
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('component does not fetch without authToken', () => {
      render(
        <UserContributions
          userId={mockProps.userId}
          mediaType={mockProps.mediaType}
          authToken=""
        />,
      );

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles API response with missing contributions array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 0,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No text contributions found/i),
        ).toBeInTheDocument();
      });
    });

    it('handles API response with null contributions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 0,
          contributions: null,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/No text contributions found/i),
        ).toBeInTheDocument();
      });
    });

    it('handles exactly 20 contributions (no load more needed)', async () => {
      const exactlyTwenty = Array.from({ length: 20 }, (_, i) => ({
        id: `contrib-${i + 1}`,
        size: 1024,
        category_id: 'cat-1',
        reviewed: true,
        title: `Contribution ${i + 1}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 20,
          contributions: exactlyTwenty,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('(20 of 20)')).toBeInTheDocument();
        expect(screen.queryByText(/Load More/i)).not.toBeInTheDocument();
      });
    });

    it('handles exactly 21 contributions (load more shows 1 remaining)', async () => {
      const twentyOne = Array.from({ length: 21 }, (_, i) => ({
        id: `contrib-${i + 1}`,
        size: 1024,
        category_id: 'cat-1',
        reviewed: true,
        title: `Contribution ${i + 1}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user_id: 'user-123',
          total_contributions: 21,
          contributions: twentyOne,
        }),
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More (1 remaining)')).toBeInTheDocument();
      });
    });

    it('uses correct API endpoint with media type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} mediaType="video" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${BACKEND_URL}/users/user-123/contributions/video`,
          expect.objectContaining({
            method: 'GET',
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer mock-auth-token',
            },
          }),
        );
      });
    });

    it('includes correct authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              accept: 'application/json',
              Authorization: 'Bearer mock-auth-token',
            },
          }),
        );
      });
    });

    it('refetches when userId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { rerender } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      rerender(
        <UserContributions
          userId="user-456"
          mediaType={mockProps.mediaType}
          authToken={mockProps.authToken}
        />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('refetches when mediaType changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { rerender } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      rerender(
        <UserContributions
          userId={mockProps.userId}
          mediaType="audio"
          authToken={mockProps.authToken}
        />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('refetches when authToken changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { rerender } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      rerender(
        <UserContributions
          userId={mockProps.userId}
          mediaType={mockProps.mediaType}
          authToken="new-token"
        />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Component Structure', () => {
    it('renders with correct root class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      });

      const container = screen
        .getByText('Text Contributions')
        .closest('.user-contributions');
      expect(container).toBeInTheDocument();
    });

    it('renders contributions list with correct class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const list = screen.getByRole('list');
        expect(list).toHaveClass('contributions-list');
      });
    });

    it('renders contribution items with correct class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const items = screen.getAllByRole('listitem');
        items.forEach((item) => {
          expect(item).toHaveClass('contribution-item');
        });
      });
    });

    it('renders contribution titles with correct class', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const { container } = render(<UserContributions {...mockProps} />);

      await waitFor(() => {
        const titles = container.querySelectorAll('.contribution-title');
        expect(titles).toHaveLength(3);
      });
    });
  });
});
