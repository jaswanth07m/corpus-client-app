/**
 * Audio validation utility functions
 * Implements the requirements from issue #142 for enhanced contextual error messaging
 */

export type AudioErrorCode =
  | 'audio_too_short'
  | 'audio_too_long'
  | 'audio_too_quiet'
  | 'excessive_noise'
  | 'unsupported_format'
  | 'file_corrupt'
  | 'incorrect_bitrate';

export interface AudioValidationResult {
  isValid: boolean;
  errors: AudioErrorCode[];
}

/**
 * Validates audio file duration and quality
 * @param file The audio file to validate
 * @returns Promise with validation result
 */
export async function validateAudioFile(
  file: File,
): Promise<AudioValidationResult> {
  const errors: AudioErrorCode[] = [];

  // Check file format
  const validAudioFormats = [
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/aac',
    'audio/mp4',
    'audio/m4a',
  ];
  if (!validAudioFormats.includes(file.type)) {
    errors.push('unsupported_format');
  }

  try {
    // Create audio context for analysis
    const audioContext = new (
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitAudioContext
    )();

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Decode audio data
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Check duration
      const durationSeconds = audioBuffer.duration;
      if (durationSeconds < 10) {
        errors.push('audio_too_short');
      } else if (durationSeconds > 900) {
        // 15 minutes = 900 seconds
        errors.push('audio_too_long');
      }

      // Check for silence or low volume
      const isQuiet = checkForSilence(audioBuffer);
      if (isQuiet) {
        errors.push('audio_too_quiet');
      }

      // Check for excessive noise (basic implementation)
      const hasExcessiveNoise = checkForExcessiveNoise(audioBuffer);
      if (hasExcessiveNoise) {
        errors.push('excessive_noise');
      }
    } catch (decodeError) {
      console.error('Audio decode error:', decodeError);
      errors.push('file_corrupt');
    }
  } catch (error) {
    console.error('Audio validation error:', error);
    errors.push('file_corrupt');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks if audio is mostly silent or too quiet
 * @param audioBuffer Decoded audio buffer
 * @returns true if audio is too quiet
 */
function checkForSilence(audioBuffer: AudioBuffer): boolean {
  const channelData = audioBuffer.getChannelData(0); // Get data from first channel
  const sampleSize = Math.min(channelData.length, 10000); // Limit sample size
  let sumSquares = 0;

  // Calculate RMS (Root Mean Square) amplitude
  for (let i = 0; i < sampleSize; i++) {
    const sample =
      channelData[Math.floor(i * (channelData.length / sampleSize))];
    sumSquares += sample * sample;
  }

  const rms = Math.sqrt(sumSquares / sampleSize);

  // RMS threshold for "too quiet" (this value may need adjustment based on testing)
  return rms < 0.01;
}

/**
 * Basic check for excessive noise in audio
 * This is a simplified implementation and may need refinement
 * @param audioBuffer Decoded audio buffer
 * @returns true if excessive noise detected
 */
function checkForExcessiveNoise(audioBuffer: AudioBuffer): boolean {
  const channelData = audioBuffer.getChannelData(0);
  const sampleSize = Math.min(channelData.length, 10000);

  // Calculate signal variance as a simple noise metric
  let sum = 0;
  let sumSquares = 0;

  for (let i = 0; i < sampleSize; i++) {
    const sample =
      channelData[Math.floor(i * (channelData.length / sampleSize))];
    sum += sample;
    sumSquares += sample * sample;
  }

  const mean = sum / sampleSize;
  const variance = sumSquares / sampleSize - mean * mean;

  // High variance without structure often indicates noise
  // This threshold may need adjustment based on testing
  return variance > 0.05 && variance < 0.2;
}
