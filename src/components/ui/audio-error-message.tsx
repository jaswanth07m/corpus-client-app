import React from 'react';
import { AlertCircle, Info, ExternalLink } from 'lucide-react';
import { AudioErrorCode } from '@/lib/audio-validation';

interface AudioErrorMessageProps {
  errorCode: AudioErrorCode;
  className?: string;
  onAction?: () => void;
}

/**
 * Error message component specifically for audio validation errors
 * Implements the requirements from issue #142
 */
export function AudioErrorMessage({
  errorCode,
  className,
  onAction,
}: AudioErrorMessageProps) {
  // Error message configuration based on error code
  const errorConfig = getAudioErrorConfig(errorCode);

  return (
    <div
      className={`bg-destructive/10 border border-destructive rounded-md p-4 my-2 ${className || ''}`}
    >
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
        <div className="space-y-2">
          <p className="text-destructive font-medium">{errorConfig.message}</p>

          {errorConfig.suggestion && (
            <div className="flex items-start text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
              <p>{errorConfig.suggestion}</p>
            </div>
          )}

          {errorConfig.actionLabel && (
            <div className="pt-1">
              <a
                href={errorConfig.actionUrl || '#'}
                onClick={(e) => {
                  if (onAction) {
                    e.preventDefault();
                    onAction();
                  }
                }}
                className="inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                {errorConfig.actionLabel}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Component to display multiple audio error messages
 */
export function AudioErrorMessageList({
  errorCodes,
  className,
}: {
  errorCodes: AudioErrorCode[];
  className?: string;
}) {
  if (!errorCodes.length) return null;

  return (
    <div className={`space-y-2 ${className || ''}`}>
      {errorCodes.map((code) => (
        <AudioErrorMessage key={code} errorCode={code} />
      ))}
    </div>
  );
}

interface ErrorConfig {
  message: string;
  suggestion: string;
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Get error message configuration based on error code
 */
function getAudioErrorConfig(errorCode: AudioErrorCode): ErrorConfig {
  const errorMessages: Record<AudioErrorCode, ErrorConfig> = {
    // Duration Issues
    audio_too_short: {
      message: 'The audio is too short. Minimum length is 10 seconds.',
      suggestion: 'Please re-record or upload a longer clip.',
    },
    audio_too_long: {
      message: 'This recording is too long. Maximum allowed is 15 minutes.',
      suggestion: 'Try trimming using a tool like Audacity or VLC.',
      actionLabel: 'Learn how to trim audio',
      actionUrl: '/help/trim-audio',
    },

    // Quality Issues
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

    // Format Issues
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

  return (
    errorMessages[errorCode] || {
      message: 'There was an issue with your audio file.',
      suggestion: 'Please try again with a different file.',
    }
  );
}
