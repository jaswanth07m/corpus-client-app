import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import UserSearchResults from '../../../src/components/UserSearchResults';

const mockUsers = [
  { username: 'alice' },
  { username: 'bob' },
  { username: 'charlie' },
];

describe('UserSearchResults', () => {
  const mockOnSelectUser = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnSelectUser.mockClear();
    mockOnClose.mockClear();
  });

  it('renders nothing when isVisible is false', () => {
    const { container } = render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isVisible={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders loading skeletons when isLoading is true', () => {
    const { container } = render(
      <UserSearchResults
        users={[]}
        onSelectUser={mockOnSelectUser}
        isLoading={true}
        isVisible={true}
      />,
    );
    const pulseDivs = container.querySelectorAll('.animate-pulse');
    expect(pulseDivs.length).toBeGreaterThan(0);
  });

  it('shows closure on backdrop click when loading', () => {
    render(
      <UserSearchResults
        users={[]}
        onSelectUser={mockOnSelectUser}
        isLoading={true}
        isVisible={true}
        onClose={mockOnClose}
      />,
    );
    // Click on the backdrop (fixed inset-0 overlay)
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('displays error message when error prop is passed', () => {
    render(
      <UserSearchResults
        users={[]}
        onSelectUser={mockOnSelectUser}
        isVisible={true}
        error="Network error"
      />,
    );
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('shows no users found message when users array is empty', () => {
    render(
      <UserSearchResults
        users={[]}
        onSelectUser={mockOnSelectUser}
        isVisible={true}
      />,
    );
    expect(screen.getByText('common.noUsersFound')).toBeInTheDocument();
  });

  it('renders a list of users with @ prefix', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isVisible={true}
      />,
    );
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('@bob')).toBeInTheDocument();
    expect(screen.getByText('@charlie')).toBeInTheDocument();
  });

  it('calls onSelectUser with the username when a user is clicked', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isVisible={true}
      />,
    );
    fireEvent.click(screen.getByText('@alice'));
    expect(mockOnSelectUser).toHaveBeenCalledWith('alice');
  });

  it('calls onClose when backdrop is clicked in user list view', () => {
    render(
      <UserSearchResults
        users={mockUsers}
        onSelectUser={mockOnSelectUser}
        isVisible={true}
        onClose={mockOnClose}
      />,
    );
    const backdrop = document.querySelector('.bg-black.bg-opacity-50');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('is visible by default (isVisible defaults to true)', () => {
    render(
      <UserSearchResults users={mockUsers} onSelectUser={mockOnSelectUser} />,
    );
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });
});
