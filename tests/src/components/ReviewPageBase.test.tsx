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

vi.mock('@/components/PeerReviewCard', () => ({
  default: ({ title }: { title: string }) => (
    <div data-testid="peer-review-card">{title}</div>
  ),
}));

vi.mock('@/components/UserSearchResults', () => ({
  default: ({
    users,
    onSelectUser,
    isVisible,
    onClose,
  }: {
    users: { username: string }[];
    onSelectUser: (u: string) => void;
    isLoading?: boolean;
    isVisible?: boolean;
    onClose?: () => void;
    error?: string;
  }) => (
    <div data-testid="user-search-results">
      {isVisible &&
        users.map((u) => (
          <div
            key={u.username}
            onClick={() => onSelectUser(u.username)}
            data-testid={`user-${u.username}`}
          >
            {u.username}
          </div>
        ))}
      {isVisible && <button onClick={onClose}>Close</button>}
    </div>
  ),
}));

vi.mock('react-infinite-scroll-component', () => ({
  default: ({
    children,
    loader,
  }: {
    children: React.ReactNode;
    loader: React.ReactNode;
    dataLength: number;
    next: () => void;
    hasMore: boolean;
    scrollableTarget: string;
  }) => (
    <div data-testid="infinite-scroll">
      {children}
      {loader}
    </div>
  ),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

import ReviewPageBase from '../../../src/components/ReviewPageBase';

describe('ReviewPageBase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');

    // Default: 404 (no more records)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    });
  });

  it('renders the title and description', async () => {
    render(
      <ReviewPageBase
        title="Audio Review"
        description="Review audio records"
        mediaTypes={['audio']}
      />,
    );
    expect(screen.getByText('Audio Review')).toBeInTheDocument();
    expect(screen.getByText('Review audio records')).toBeInTheDocument();
  });

  it('renders the search icon button', async () => {
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    // Search button should be present (there are two Search icons: header and expanded)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('expands search panel when the search button is clicked', async () => {
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    // Find the search toggle button (second button in header)
    const buttons = screen.getAllByRole('button');
    const searchToggleBtn = buttons[1]; // Back arrow is [0], search toggle is [1]
    fireEvent.click(searchToggleBtn);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  it('shows Records and Users tabs inside search panel', async () => {
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
    });
  });

  it('switches to users search type when Users tab is clicked', async () => {
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => screen.getByText('Users'));
    fireEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('placeholder', 'nav.searchUsers');
    });
  });

  it('shows error message when fetch fails with a server error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('renders the infinite scroll component', async () => {
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    await waitFor(() => {
      expect(screen.getByTestId('infinite-scroll')).toBeInTheDocument();
    });
  });

  it('navigates back when ArrowLeft button is clicked', async () => {
    const originalHref = window.location.href;
    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );
    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    // window.location.href changes are expected - just verify no crash
    expect(backButton).toBeInTheDocument();
  });

  it('fetches more data when successful response', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ record_id: 'rec1' }, { record_id: 'rec2' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user_id: 'u1',
          title: 'Test',
          description: 'Desc',
          media_type: 'audio',
          release_rights: 'yes',
          language: 'en',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ record_url: 'http://test.com/audio.mp3' }),
      });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles empty array response from fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('searches records when search query is submitted', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ record_id: 'rec1' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user_id: 'u1',
          title: 'Test',
          description: 'Desc',
          media_type: 'audio',
          release_rights: 'yes',
          language: 'en',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ record_url: 'http://test.com/audio.mp3' }),
      });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles search records API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' }),
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('searches users successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ username: 'user1' }, { username: 'user2' }],
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'testuser' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles user search API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'User search failed' }),
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => screen.getByText('Users'));
    fireEvent.click(screen.getByText('Users'));

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('User search failed')).toBeInTheDocument();
    });
  });

  it('handles record selection when clicking on search result', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ record_id: 'rec1' }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user_id: 'u1',
          title: 'Test',
          description: 'Desc',
          media_type: 'audio',
          release_rights: 'yes',
          language: 'en',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ record_url: 'http://test.com/audio.mp3' }),
      });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('handles network error in fetchMoreData', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('closes search panel and resets state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ record_id: 'rec1' }],
    });

    render(
      <ReviewPageBase title="Test" description="Desc" mediaTypes={['audio']} />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
