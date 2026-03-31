import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserSearchResults from '../src/components/UserSearchResults';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('UserSearchResults', () => {
  const mockUsers = [
    { username: 'john_doe' },
    { username: 'jane_smith' },
    { username: 'bob_wilson' },
  ];

  const mockOnSelectUser = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when isVisible is false', () => {
    const { container } = render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isVisible={false}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows loading skeleton when isLoading is true', () => {
    const { container } = render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isLoading={true}
      />,
    );

    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems).toHaveLength(5);
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'Failed to fetch users';

    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        error={errorMessage}
      />,
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows "no users found" message when users array is empty', () => {
    render(<UserSearchResults users={[]} onSelectUser={mockOnSelectUser} />);

    expect(screen.getByText('common.noUsersFound')).toBeInTheDocument();
  });

  it('renders list of users when users are provided', () => {
    render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );

    expect(screen.getByText('@john_doe')).toBeInTheDocument();
    expect(screen.getByText('@jane_smith')).toBeInTheDocument();
    expect(screen.getByText('@bob_wilson')).toBeInTheDocument();
  });

  it('calls onSelectUser with username when user is clicked', () => {
    render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );

    const userElement = screen.getByText('@john_doe');
    fireEvent.click(userElement);

    expect(mockOnSelectUser).toHaveBeenCalledWith('john_doe');
    expect(mockOnSelectUser).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        onClose={mockOnClose}
      />,
    );

    const backdrop = screen
      .getByText('@john_doe')
      .closest('.fixed.inset-0')?.previousElementSibling;

    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('does not render users when isLoading is true', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isLoading={true}
      />,
    );

    expect(screen.queryByText('@john_doe')).not.toBeInTheDocument();
    expect(screen.queryByText('@jane_smith')).not.toBeInTheDocument();
    expect(screen.queryByText('@bob_wilson')).not.toBeInTheDocument();
  });

  it('does not render users when error is present', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        error="Some error occurred"
      />,
    );

    expect(screen.queryByText('@john_doe')).not.toBeInTheDocument();
    expect(screen.getByText('Some error occurred')).toBeInTheDocument();
  });

  it('handles single user in the list', () => {
    const singleUser = [{ username: 'single_user' }];

    render(
      <UserSearchResults users={singleUser} onSelectUser={mockOnSelectUser} />,
    );

    expect(screen.getByText('@single_user')).toBeInTheDocument();

    const userElement = screen.getByText('@single_user');
    fireEvent.click(userElement);

    expect(mockOnSelectUser).toHaveBeenCalledWith('single_user');
  });

  it('has proper modal structure with z-index', () => {
    const { container } = render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );

    const modalContainer = container.querySelector('.fixed.inset-0.z-50');
    expect(modalContainer).toBeInTheDocument();
  });

  it('applies hover styles to user items', () => {
    render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );

    const userItem = screen.getByText('@john_doe').parentElement;
    expect(userItem).toHaveClass('hover:bg-slate-50');
    expect(userItem).toHaveClass('cursor-pointer');
  });

  it('renders error with red border styling', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        error="Test error"
      />,
    );

    const { container } = render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        error="Test error"
      />,
    );

    const errorModal = container.querySelector('.border-red-200');
    expect(errorModal).toBeInTheDocument();
  });

  it('renders loading state with correct styling', () => {
    const { container } = render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isLoading={true}
      />,
    );

    const loadingModal = container.querySelector('.max-h-60');
    expect(loadingModal).toBeInTheDocument();
  });

  it('renders users with correct max height', () => {
    const { container } = render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );

    const usersModal = container.querySelector('.max-h-96');
    expect(usersModal).toBeInTheDocument();
  });
});
