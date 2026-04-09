import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock constants BEFORE any other imports
vi.mock('@/lib/constants', async () => {
  return {
    BACKEND_URL: 'http://test-api.com',
  };
});

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;
// Import component AFTER mocks are set up
import CategoryTags from '../../../src/components/CategoryTags';

describe('CategoryTags', () => {
  const mockToken = 'test-token-123';
  const mockCategoryIds = ['cat-1', 'cat-2'];

  const mockCategories = [
    {
      id: 'cat-1',
      name: 'fables',
      title: 'Fables',
      description: 'Traditional stories',
      published: true,
      rank: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      name: 'music',
      title: 'Music',
      description: 'Musical content',
      published: true,
      rank: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'cat-3',
      name: 'unpublished',
      title: 'Unpublished Category',
      description: 'Should not appear',
      published: false,
      rank: 3,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      }),
    );
  });

  it('renders null when loading', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(
      <CategoryTags categoryIds={mockCategoryIds} token={mockToken} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders null when no category IDs provided', () => {
    const { container } = render(
      <CategoryTags categoryIds={[]} token={mockToken} />,
    );

    expect(container.firstChild).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches categories and renders tags', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(<CategoryTags categoryIds={mockCategoryIds} token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Fables')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
    });
  });

  it('renders null when categories array is empty after filtering', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(
      <CategoryTags categoryIds={['non-existent']} token={mockToken} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('filters out unpublished categories', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(
      <CategoryTags
        categoryIds={['cat-1', 'cat-2', 'cat-3']}
        token={mockToken}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText('Fables')).toBeInTheDocument();
      expect(screen.getByText('Music')).toBeInTheDocument();
      expect(
        screen.queryByText('Unpublished Category'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders category tags with correct styling', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(<CategoryTags categoryIds={mockCategoryIds} token={mockToken} />);

    await waitFor(() => {
      const fablesText = screen.getByText('Fables');
      // Get the outer span (the tag container) - parent of the inner span
      const fablesTag = fablesText.parentElement;
      expect(fablesTag).toHaveClass('bg-blue-100');
      expect(fablesTag).toHaveClass('text-blue-800');
      expect(fablesTag).toHaveClass('rounded-full');
    });
  });

  it('handles fetch error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(
      <CategoryTags categoryIds={mockCategoryIds} token={mockToken} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles non-ok response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { container } = render(
      <CategoryTags categoryIds={mockCategoryIds} token={mockToken} />,
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('uses correct API endpoint with authorization header', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(<CategoryTags categoryIds={mockCategoryIds} token={mockToken} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://test-api.com/categories/',
        {
          headers: {
            Authorization: `Bearer ${mockToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    });
  });

  it('renders category title with truncate styling', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    render(<CategoryTags categoryIds={mockCategoryIds} token={mockToken} />);

    await waitFor(() => {
      const fablesText = screen.getByText('Fables');
      const innerSpan = fablesText.closest('span');
      expect(innerSpan).toHaveClass('truncate');
      expect(innerSpan).toHaveClass('max-w-[100px]');
    });
  });

  it('does not fetch when categoryIds is empty array', () => {
    render(<CategoryTags categoryIds={[]} token={mockToken} />);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('renders with single category', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [mockCategories[0]],
    });

    render(<CategoryTags categoryIds={['cat-1']} token={mockToken} />);

    await waitFor(() => {
      expect(screen.getByText('Fables')).toBeInTheDocument();
      expect(screen.queryByText('Music')).not.toBeInTheDocument();
    });
  });

  it('has correct container structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    });

    const { container } = render(
      <CategoryTags categoryIds={mockCategoryIds} token={mockToken} />,
    );

    await waitFor(() => {
      const containerDiv = container.firstChild;
      expect(containerDiv).toHaveClass('flex');
      expect(containerDiv).toHaveClass('flex-wrap');
      expect(containerDiv).toHaveClass('gap-2');
      expect(containerDiv).toHaveClass('mt-2');
    });
  });
});
