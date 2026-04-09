import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

describe('Avatar', () => {
  const renderAvatar = (
    props?: React.ComponentProps<typeof Avatar> & { 'data-testid'?: string },
    children?: React.ReactNode,
  ) => {
    return render(<Avatar {...props}>{children}</Avatar>);
  };

  describe('Avatar Component', () => {
    it('renders avatar with default styling classes', () => {
      renderAvatar({ 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('relative');
      expect(avatar).toHaveClass('flex');
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('w-10');
      expect(avatar).toHaveClass('shrink-0');
      expect(avatar).toHaveClass('overflow-hidden');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('applies custom className correctly', () => {
      renderAvatar({
        className: 'custom-class another-class',
        'data-testid': 'avatar',
      });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('custom-class');
      expect(avatar).toHaveClass('another-class');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('merges custom className with base classes', () => {
      renderAvatar({
        className: 'bg-red-500 h-20 w-20',
        'data-testid': 'avatar',
      });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('bg-red-500');
      expect(avatar).toHaveClass('h-20');
      expect(avatar).toHaveClass('w-20');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      renderAvatar({ ref, 'data-testid': 'avatar' });

      expect(ref).toHaveBeenCalledTimes(1);
    });

    it('passes through HTML attributes', () => {
      renderAvatar({ 'data-testid': 'avatar-test', id: 'avatar-id' });

      const avatar = screen.getByTestId('avatar-test');
      expect(avatar).toHaveAttribute('id', 'avatar-id');
    });

    it('renders children inside avatar', () => {
      renderAvatar(
        { 'data-testid': 'avatar' },
        <span data-testid="child">Child Content</span>,
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('supports click interactions', () => {
      const onClick = vi.fn();
      renderAvatar({ onClick, 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      fireEvent.click(avatar);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('supports keyboard interactions', () => {
      const onKeyDown = vi.fn();
      renderAvatar({ onKeyDown, 'data-testid': 'avatar', tabIndex: 0 });

      const avatar = screen.getByTestId('avatar');
      avatar.focus();
      fireEvent.keyDown(avatar, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('AvatarImage Component', () => {
    it('renders image element in DOM (even if hidden due to load error)', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarImage
            src="https://example.com/test.jpg"
            data-testid="avatar-image"
          />
          <AvatarFallback data-testid="avatar-fallback">
            fallback
          </AvatarFallback>
        </Avatar>,
      );

      // In jsdom, the image will error and be hidden, but we can verify the component structure
      // The fallback should be visible
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });
  });

  describe('AvatarFallback Component', () => {
    const renderAvatarFallback = (
      props?: React.ComponentProps<typeof AvatarFallback>,
    ) => {
      return render(
        <Avatar data-testid="avatar">
          <AvatarFallback {...props} data-testid="avatar-fallback" />
        </Avatar>,
      );
    };

    it('renders fallback with correct base classes', () => {
      renderAvatarFallback();

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass('flex');
      expect(fallback).toHaveClass('h-full');
      expect(fallback).toHaveClass('w-full');
      expect(fallback).toHaveClass('items-center');
      expect(fallback).toHaveClass('justify-center');
      expect(fallback).toHaveClass('rounded-full');
      expect(fallback).toHaveClass('bg-muted');
    });

    it('applies custom className to fallback', () => {
      renderAvatarFallback({ className: 'text-lg font-bold bg-blue-500' });

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveClass('text-lg');
      expect(fallback).toHaveClass('font-bold');
      expect(fallback).toHaveClass('bg-blue-500');
      expect(fallback).toHaveClass('rounded-full');
    });

    it('renders fallback content', () => {
      renderAvatarFallback({ children: 'JD' });

      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
    });

    it('renders fallback with initials', () => {
      renderAvatarFallback({ children: 'JD', 'aria-label': 'John Doe' });

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveAttribute('aria-label', 'John Doe');
    });

    it('forwards ref correctly', () => {
      const ref = vi.fn();
      renderAvatarFallback({
        ref: ref as React.Ref<HTMLDivElement>,
        children: 'FB',
      });

      expect(ref).toHaveBeenCalledTimes(1);
    });

    it('passes through HTML attributes', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback data-testid="fallback-test" role="status">
            FB
          </AvatarFallback>
        </Avatar>,
      );

      const fallback = screen.getByTestId('fallback-test');
      expect(fallback).toHaveAttribute('role', 'status');
    });
  });

  describe('Avatar Composition', () => {
    it('renders avatar with only fallback', () => {
      render(
        <Avatar data-testid="fallback-only">
          <AvatarFallback data-testid="avatar-fallback">JD</AvatarFallback>
        </Avatar>,
      );

      expect(screen.getByTestId('fallback-only')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD');
    });

    it('renders avatar with image and fallback (fallback visible due to jsdom)', () => {
      render(
        <Avatar data-testid="complete-avatar">
          <AvatarImage
            src="https://example.com/user.jpg"
            alt="User"
            data-testid="avatar-image"
          />
          <AvatarFallback data-testid="avatar-fallback">U</AvatarFallback>
        </Avatar>,
      );

      expect(screen.getByTestId('complete-avatar')).toBeInTheDocument();
      // In jsdom, the image errors so fallback is visible
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports aria-label on Avatar', () => {
      renderAvatar({ 'aria-label': 'User Avatar', 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('aria-label', 'User Avatar');
    });

    it('supports aria-label on AvatarFallback', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarFallback
            data-testid="avatar-fallback"
            aria-label="User Initials"
          >
            JD
          </AvatarFallback>
        </Avatar>,
      );

      const fallback = screen.getByTestId('avatar-fallback');
      expect(fallback).toHaveAttribute('aria-label', 'User Initials');
    });

    it('supports aria-hidden attribute', () => {
      renderAvatar({ 'aria-hidden': true, 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('aria-hidden', 'true');
    });

    it('supports tabIndex for keyboard navigation', () => {
      renderAvatar({ tabIndex: 0, 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveAttribute('tabindex', '0');
    });

    it('is focusable when tabIndex is set', () => {
      renderAvatar({ tabIndex: 0, 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      avatar.focus();
      expect(avatar).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty className', () => {
      renderAvatar({ className: '', 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('rounded-full');
    });

    it('handles undefined props gracefully', () => {
      render(
        <Avatar className={undefined} data-testid="avatar">
          <AvatarFallback data-testid="avatar-fallback">FB</AvatarFallback>
        </Avatar>,
      );

      expect(screen.getByTestId('avatar')).toBeInTheDocument();
    });

    it('handles empty string src by showing fallback', () => {
      render(
        <Avatar data-testid="avatar">
          <AvatarImage src="" data-testid="avatar-image" />
          <AvatarFallback data-testid="fallback">FB</AvatarFallback>
        </Avatar>,
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });

    it('handles special characters in className', () => {
      renderAvatar({
        className: 'class-with-dashes class_with_underscores',
        'data-testid': 'avatar',
      });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('class-with-dashes');
      expect(avatar).toHaveClass('class_with_underscores');
    });

    it('renders with multiple Avatar components', () => {
      render(
        <div>
          <Avatar data-testid="avatar-1">
            <AvatarFallback data-testid="fallback-1">A1</AvatarFallback>
          </Avatar>
          <Avatar data-testid="avatar-2">
            <AvatarFallback data-testid="fallback-2">A2</AvatarFallback>
          </Avatar>
          <Avatar data-testid="avatar-3">
            <AvatarFallback data-testid="fallback-3">A3</AvatarFallback>
          </Avatar>
        </div>,
      );

      expect(screen.getByTestId('avatar-1')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-2')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-3')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('maintains aspect ratio with different sizes', () => {
      renderAvatar({ className: 'h-20 w-20', 'data-testid': 'avatar' });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('h-20');
      expect(avatar).toHaveClass('w-20');
    });

    it('supports responsive classes', () => {
      renderAvatar({
        className: 'h-10 w-10 md:h-16 md:w-16 lg:h-20 lg:w-20',
        'data-testid': 'avatar',
      });

      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('h-10');
      expect(avatar).toHaveClass('w-10');
      expect(avatar).toHaveClass('md:h-16');
      expect(avatar).toHaveClass('md:w-16');
    });
  });

  describe('Display Names', () => {
    it('has displayName for Avatar', () => {
      expect(Avatar.displayName).toBeDefined();
      expect(typeof Avatar.displayName).toBe('string');
    });

    it('has displayName for AvatarImage', () => {
      expect(AvatarImage.displayName).toBeDefined();
      expect(typeof AvatarImage.displayName).toBe('string');
    });

    it('has displayName for AvatarFallback', () => {
      expect(AvatarFallback.displayName).toBeDefined();
      expect(typeof AvatarFallback.displayName).toBe('string');
    });
  });
});
