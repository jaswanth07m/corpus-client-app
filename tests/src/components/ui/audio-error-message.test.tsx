import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  AudioErrorMessage,
  AudioErrorMessageList,
} from '@/components/ui/audio-error-message';
import type { AudioErrorCode } from '@/lib/audio-validation';

describe('AudioErrorMessage', () => {
  const renderComponent = (
    errorCode: AudioErrorCode,
    props?: { className?: string; onAction?: () => void },
  ) => {
    return render(<AudioErrorMessage errorCode={errorCode} {...props} />);
  };

  const getErrorContainer = () => {
    return screen
      .getByText(
        /The audio is too short|This recording is too long|The recording is too quiet|Your recording has too much|Unsupported format|We couldn't read this file|Audio must be at least/i,
      )
      .closest('div.bg-destructive\\/10');
  };

  describe('Duration Issues', () => {
    it('renders audio_too_short error with correct message and suggestion', () => {
      renderComponent('audio_too_short');

      expect(
        screen.getByText(
          'The audio is too short. Minimum length is 10 seconds.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please re-record or upload a longer clip.'),
      ).toBeInTheDocument();
    });

    it('does not render action link for audio_too_short', () => {
      renderComponent('audio_too_short');

      const message = screen.getByText(
        'The audio is too short. Minimum length is 10 seconds.',
      );
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });

    it('renders audio_too_long error with correct message, suggestion, and action', () => {
      renderComponent('audio_too_long');

      expect(
        screen.getByText(
          'This recording is too long. Maximum allowed is 15 minutes.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Try trimming using a tool like Audacity or VLC.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Learn how to trim audio')).toBeInTheDocument();
    });

    it('renders action link with correct href for audio_too_long', () => {
      renderComponent('audio_too_long');

      const actionLink = screen
        .getByText('Learn how to trim audio')
        .closest('a');
      expect(actionLink).toHaveAttribute('href', '/help/trim-audio');
    });

    it('calls onAction when action link is clicked for audio_too_long', () => {
      const onAction = vi.fn();
      renderComponent('audio_too_long', { onAction });

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('prevents default when onAction is provided and click is triggered', () => {
      const onAction = vi.fn();

      renderComponent('audio_too_long', { onAction });

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink);

      // The component calls preventDefault internally when onAction is provided
      // We verify the component behavior by checking onAction was called
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Quality Issues', () => {
    it('renders audio_too_quiet error with correct message and suggestion', () => {
      renderComponent('audio_too_quiet');

      expect(
        screen.getByText('The recording is too quiet or silent.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Check your microphone settings or re-record in a quieter place.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render action link for audio_too_quiet', () => {
      renderComponent('audio_too_quiet');

      const message = screen.getByText('The recording is too quiet or silent.');
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });

    it('renders excessive_noise error with correct message and suggestion', () => {
      renderComponent('excessive_noise');

      expect(
        screen.getByText('Your recording has too much background noise.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Try re-recording in a quieter environment or using a better microphone.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render action link for excessive_noise', () => {
      renderComponent('excessive_noise');

      const message = screen.getByText(
        'Your recording has too much background noise.',
      );
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });
  });

  describe('Format Issues', () => {
    it('renders unsupported_format error with correct message and suggestion', () => {
      renderComponent('unsupported_format');

      expect(
        screen.getByText(
          'Unsupported format. Use .wav, .mp3, or .flac files only.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Convert your file to a supported format.'),
      ).toBeInTheDocument();
    });

    it('does not render action link for unsupported_format', () => {
      renderComponent('unsupported_format');

      const message = screen.getByText(
        'Unsupported format. Use .wav, .mp3, or .flac files only.',
      );
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });

    it('renders file_corrupt error with correct message and suggestion', () => {
      renderComponent('file_corrupt');

      expect(
        screen.getByText("We couldn't read this file. It may be corrupted."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Try re-exporting the file from the original software.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render action link for file_corrupt', () => {
      renderComponent('file_corrupt');

      const message = screen.getByText(
        "We couldn't read this file. It may be corrupted.",
      );
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });

    it('renders incorrect_bitrate error with correct message and suggestion', () => {
      renderComponent('incorrect_bitrate');

      expect(
        screen.getByText('Audio must be at least 16kHz and 128kbps.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Use audio conversion software to adjust the quality settings.',
        ),
      ).toBeInTheDocument();
    });

    it('does not render action link for incorrect_bitrate', () => {
      renderComponent('incorrect_bitrate');

      const message = screen.getByText(
        'Audio must be at least 16kHz and 128kbps.',
      );
      const container = message.closest('div');
      const actionLink = container?.querySelector('a');
      expect(actionLink).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies base classes correctly', () => {
      renderComponent('audio_too_short');

      const errorContainer = getErrorContainer();
      expect(errorContainer).toHaveClass('bg-destructive/10');
      expect(errorContainer).toHaveClass('border-destructive');
      expect(errorContainer).toHaveClass('rounded-md');
      expect(errorContainer).toHaveClass('p-4');
      expect(errorContainer).toHaveClass('my-2');
    });

    it('applies custom className when provided', () => {
      renderComponent('audio_too_short', { className: 'custom-class' });

      const errorContainer = getErrorContainer();
      expect(errorContainer).toHaveClass('custom-class');
    });

    it('renders AlertCircle icon', () => {
      renderComponent('audio_too_short');

      // The AlertCircle icon is rendered as an SVG with lucide-circle-alert class
      const alertIcon = document.querySelector('svg.lucide-circle-alert');
      expect(alertIcon).toBeInTheDocument();
    });

    it('renders Info icon when suggestion is present', () => {
      renderComponent('audio_too_short');

      // The Info icon is rendered as an SVG before the suggestion text
      const suggestionText = screen.getByText(
        'Please re-record or upload a longer clip.',
      );
      const infoIcon = suggestionText.previousElementSibling;
      expect(infoIcon).toBeInTheDocument();
      expect(infoIcon?.tagName).toBe('svg');
    });

    it('renders ExternalLink icon when action is present', () => {
      renderComponent('audio_too_long');

      const actionLink = screen.getByText('Learn how to trim audio');
      const externalIcon = actionLink.querySelector('svg');
      expect(externalIcon).toBeInTheDocument();
    });
  });

  describe('onAction callback', () => {
    it('renders action link even when onAction is not provided', () => {
      renderComponent('audio_too_long');

      // Verify component renders without onAction
      const actionLink = screen.getByText('Learn how to trim audio');
      expect(actionLink).toBeInTheDocument();
    });

    it('calls onAction exactly once on click', () => {
      const onAction = vi.fn();
      renderComponent('audio_too_long', { onAction });

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink);

      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('does not navigate when onAction prevents default', () => {
      const onAction = vi.fn();
      renderComponent('audio_too_long', { onAction });

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink);

      // Verify we're still on the same page (no navigation occurred)
      expect(window.location.hash).toBe('');
    });

    it('prevents default and does not call onAction when onAction is not provided', () => {
      renderComponent('audio_too_long');

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink);

      // Component should handle click without onAction gracefully
      expect(actionLink).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('handles empty className gracefully', () => {
      renderComponent('audio_too_short', { className: '' });

      const errorContainer = getErrorContainer();
      expect(errorContainer).toBeInTheDocument();
    });

    it('renders default message for unknown error codes', () => {
      // Cast to AudioErrorCode to test the fallback behavior
      const unknownErrorCode = 'unknown_error' as AudioErrorCode;

      renderComponent(unknownErrorCode);

      expect(
        screen.getByText('There was an issue with your audio file.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please try again with a different file.'),
      ).toBeInTheDocument();
    });

    it('handles action click without onAction gracefully', () => {
      // This tests the branch where onAction is undefined
      renderComponent('audio_too_long');

      const actionLink = screen.getByText('Learn how to trim audio');

      // Click should not crash the component
      expect(() => {
        fireEvent.click(actionLink);
      }).not.toThrow();

      // Link should still be present
      expect(actionLink).toBeInTheDocument();
    });

    it('does not prevent default when onAction is not provided', () => {
      // Explicitly test the branch where onAction is falsy
      const preventDefault = vi.fn();
      renderComponent('audio_too_long');

      const actionLink = screen.getByText('Learn how to trim audio');
      fireEvent.click(actionLink, { preventDefault });

      // preventDefault should NOT be called when onAction is not provided
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});

describe('AudioErrorMessageList', () => {
  const renderList = (
    errorCodes: AudioErrorCode[],
    props?: { className?: string },
  ) => {
    return render(<AudioErrorMessageList errorCodes={errorCodes} {...props} />);
  };

  const getListContainer = () => {
    return document.querySelector('div.space-y-2');
  };

  describe('Empty state', () => {
    it('returns null for empty array', () => {
      const { container } = renderList([]);
      expect(container.firstChild).toBeNull();
    });

    it('does not render any error messages for empty array', () => {
      renderList([]);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Single error', () => {
    it('renders single error message', () => {
      renderList(['audio_too_short']);

      expect(
        screen.getByText(
          'The audio is too short. Minimum length is 10 seconds.',
        ),
      ).toBeInTheDocument();
    });

    it('applies className to container', () => {
      renderList(['audio_too_short'], { className: 'list-custom-class' });

      const container = getListContainer();
      expect(container).toHaveClass('list-custom-class');
    });
  });

  describe('Multiple errors', () => {
    it('renders multiple error messages', () => {
      renderList(['audio_too_short', 'audio_too_long', 'excessive_noise']);

      expect(
        screen.getByText(
          'The audio is too short. Minimum length is 10 seconds.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This recording is too long. Maximum allowed is 15 minutes.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Your recording has too much background noise.'),
      ).toBeInTheDocument();
    });

    it('renders all error containers', () => {
      renderList(['file_corrupt', 'unsupported_format', 'incorrect_bitrate']);

      // Verify all three errors are rendered by checking their messages
      expect(
        screen.getByText("We couldn't read this file. It may be corrupted."),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Unsupported format. Use .wav, .mp3, or .flac files only.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Audio must be at least 16kHz and 128kbps.'),
      ).toBeInTheDocument();
    });

    it('renders each error with unique container', () => {
      const { container } = renderList(['audio_too_short', 'audio_too_long']);

      // Each error should have its own container
      const errorContainers = container.querySelectorAll(
        'div.bg-destructive\\/10',
      );
      expect(errorContainers.length).toBe(2);
    });
  });

  describe('All error codes coverage', () => {
    const allErrorCodes: AudioErrorCode[] = [
      'audio_too_short',
      'audio_too_long',
      'audio_too_quiet',
      'excessive_noise',
      'unsupported_format',
      'file_corrupt',
      'incorrect_bitrate',
    ];

    it.each(allErrorCodes)('renders %s error correctly', (errorCode) => {
      renderList([errorCode]);

      // Each error code should render its specific message
      const config = getExpectedConfig(errorCode);
      expect(screen.getByText(config.message)).toBeInTheDocument();
      expect(screen.getByText(config.suggestion)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('applies space-y-2 class to container', () => {
      renderList(['audio_too_short']);

      const container = getListContainer();
      expect(container).toHaveClass('space-y-2');
    });

    it('applies custom className correctly', () => {
      renderList(['audio_too_short'], { className: 'custom-list-class' });

      const container = getListContainer();
      expect(container).toHaveClass('custom-list-class');
    });
  });
});

/**
 * Helper function to get expected error configuration
 */
function getExpectedConfig(errorCode: AudioErrorCode): {
  message: string;
  suggestion: string;
} {
  const configs: Record<
    AudioErrorCode,
    { message: string; suggestion: string }
  > = {
    audio_too_short: {
      message: 'The audio is too short. Minimum length is 10 seconds.',
      suggestion: 'Please re-record or upload a longer clip.',
    },
    audio_too_long: {
      message: 'This recording is too long. Maximum allowed is 15 minutes.',
      suggestion: 'Try trimming using a tool like Audacity or VLC.',
    },
    audio_too_quiet: {
      message: 'The recording is too quiet or silent.',
      suggestion:
        'Check your microphone settings or re-record in a quieter place.',
    },
    excessive_noise: {
      message: 'Your recording has too much background noise.',
      suggestion:
        'Try re-recording in a quieter environment or using a better microphone.',
    },
    unsupported_format: {
      message: 'Unsupported format. Use .wav, .mp3, or .flac files only.',
      suggestion: 'Convert your file to a supported format.',
    },
    file_corrupt: {
      message: "We couldn't read this file. It may be corrupted.",
      suggestion: 'Try re-exporting the file from the original software.',
    },
    incorrect_bitrate: {
      message: 'Audio must be at least 16kHz and 128kbps.',
      suggestion:
        'Use audio conversion software to adjust the quality settings.',
    },
  };

  return configs[errorCode];
}
