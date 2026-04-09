import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

describe('AlertDialog Component', () => {
  it('renders the trigger button correctly', () => {
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Title</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
  });

  it('opens the dialog and shows content when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete Account</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    // Initial state: Content should not be visible
    expect(
      screen.queryByText('Are you absolutely sure?'),
    ).not.toBeInTheDocument();

    // Click the trigger
    const triggerButton = screen.getByText('Delete Account');
    await user.click(triggerButton);

    // Dialog content should now be visible
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Are you absolutely sure?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Test Title</AlertDialogTitle>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>,
    );

    // Open it
    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Test Title')).toBeInTheDocument();

    // Close it via Cancel button
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // It should disappear eventually (wait for Radix animation/state update)
    await waitFor(() => {
      expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    });
  });

  it('closes the dialog when Action is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Test Title 2</AlertDialogTitle>
          <AlertDialogAction>Confirm</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    await user.click(screen.getByText('Open'));
    expect(screen.getByText('Test Title 2')).toBeInTheDocument();

    const actionButton = screen.getByText('Confirm');
    await user.click(actionButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Title 2')).not.toBeInTheDocument();
    });
  });

  it('applies custom classNames correctly', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogTrigger data-testid="trigger" className="custom-trigger">
          Open
        </AlertDialogTrigger>
        <AlertDialogContent data-testid="content" className="custom-content">
          <AlertDialogHeader data-testid="header" className="custom-header">
            <AlertDialogTitle data-testid="title" className="custom-title">
              Title
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="desc" className="custom-desc">
              Description
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-testid="footer" className="custom-footer">
            <AlertDialogCancel data-testid="cancel" className="custom-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction data-testid="action" className="custom-action">
              Action
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
    expect(screen.getByTestId('header')).toHaveClass('custom-header');
    expect(screen.getByTestId('title')).toHaveClass('custom-title');
    expect(screen.getByTestId('desc')).toHaveClass('custom-desc');
    expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    expect(screen.getByTestId('cancel')).toHaveClass('custom-cancel');
    expect(screen.getByTestId('action')).toHaveClass('custom-action');
  });
});
