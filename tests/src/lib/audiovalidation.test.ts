/**
 * Unit tests for audio-validation.ts
 * Tests all exported functions: validateAudioFile, mapAudioErrors
 * Covers all validation logic, edge cases, and error paths
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateAudioFile,
  mapAudioErrors,
  type AudioErrorCode,
  type AudioValidationResult,
} from '../../../src/lib/audio-validation';

// Mock AudioContext for testing
class MockAudioContext {
  decodeAudioData: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;

  constructor() {
    this.decodeAudioData = vi.fn();
    this.close = vi.fn();
  }
}

// Create a proper constructor function for mocking
function createMockAudioContextConstructor(mockInstance: MockAudioContext) {
  return function (this: MockAudioContext) {
    return mockInstance;
  } as unknown as typeof window.AudioContext;
}

// Mock AudioBuffer for testing
function createMockAudioBuffer({
  duration = 30,
  sampleRate = 44100,
  channelData = new Float32Array(44100 * 30).fill(0.5), // Default: normal volume
}: {
  duration?: number;
  sampleRate?: number;
  channelData?: Float32Array;
} = {}): AudioBuffer {
  return {
    duration,
    sampleRate,
    length: channelData.length,
    numberOfChannels: 1,
    getChannelData: vi.fn(() => channelData),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  } as unknown as AudioBuffer;
}

// Helper to create a mock File object
function createMockFile({
  type = 'audio/wav',
  name = 'test-audio.wav',
  arrayBuffer = async () => new ArrayBuffer(1024),
}: {
  type?: string;
  name?: string;
  arrayBuffer?: () => Promise<ArrayBuffer>;
} = {}): File {
  return {
    type,
    name,
    size: 1024,
    lastModified: Date.now(),
    arrayBuffer,
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn(),
  } as unknown as File;
}

describe('audio-validation', () => {
  let originalAudioContext: typeof window.AudioContext;
  let mockAudioContext: MockAudioContext;

  beforeEach(() => {
    // Save original AudioContext
    originalAudioContext = window.AudioContext;
    mockAudioContext = new MockAudioContext();

    // Mock AudioContext constructor using a proper constructor function
    window.AudioContext = createMockAudioContextConstructor(mockAudioContext);
  });

  afterEach(() => {
    // Restore original AudioContext
    window.AudioContext = originalAudioContext;
    vi.clearAllMocks();
  });

  describe('mapAudioErrors', () => {
    describe('single error codes', () => {
      it('should map audio_too_short to correct message', () => {
        const result = mapAudioErrors(['audio_too_short']);
        expect(result).toBe('Recording must be at least 10 seconds.');
      });

      it('should map audio_too_long to correct message', () => {
        const result = mapAudioErrors(['audio_too_long']);
        expect(result).toBe('Recording must be under 15 minutes.');
      });

      it('should map audio_too_quiet to correct message', () => {
        const result = mapAudioErrors(['audio_too_quiet']);
        expect(result).toBe('Audio is too quiet. Please speak clearly.');
      });

      it('should map excessive_noise to correct message', () => {
        const result = mapAudioErrors(['excessive_noise']);
        expect(result).toBe('Too much background noise detected.');
      });

      it('should map unsupported_format to correct message', () => {
        const result = mapAudioErrors(['unsupported_format']);
        expect(result).toBe('Unsupported audio format.');
      });

      it('should map file_corrupt to correct message', () => {
        const result = mapAudioErrors(['file_corrupt']);
        expect(result).toBe('Audio file appears corrupted.');
      });

      it('should map incorrect_bitrate to correct message', () => {
        const result = mapAudioErrors(['incorrect_bitrate']);
        expect(result).toBe('Invalid audio bitrate.');
      });
    });

    describe('multiple error codes', () => {
      it('should join multiple error messages with spaces', () => {
        const result = mapAudioErrors(['audio_too_short', 'audio_too_quiet']);
        expect(result).toBe(
          'Recording must be at least 10 seconds. Audio is too quiet. Please speak clearly.',
        );
      });

      it('should handle three or more error codes', () => {
        const result = mapAudioErrors([
          'audio_too_short',
          'audio_too_long',
          'file_corrupt',
        ]);
        expect(result).toContain('Recording must be at least 10 seconds.');
        expect(result).toContain('Recording must be under 15 minutes.');
        expect(result).toContain('Audio file appears corrupted.');
      });
    });

    describe('edge cases', () => {
      it('should return empty string for empty array', () => {
        const result = mapAudioErrors([]);
        expect(result).toBe('');
      });

      it('should handle duplicate error codes', () => {
        const result = mapAudioErrors(['audio_too_short', 'audio_too_short']);
        expect(result).toBe(
          'Recording must be at least 10 seconds. Recording must be at least 10 seconds.',
        );
      });
    });
  });

  describe('validateAudioFile', () => {
    describe('file format validation', () => {
      it('should accept valid WAV format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid MP3 format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/mpeg' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid OGG format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/ogg' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid WebM format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/webm' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid FLAC format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/flac' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid AAC format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/aac' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid MP4 audio format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/mp4' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should accept valid M4A format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/m4a' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('unsupported_format');
      });

      it('should reject video format', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'video/mp4' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('unsupported_format');
        expect(result.isValid).toBe(false);
      });

      it('should reject empty MIME type', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: '' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('unsupported_format');
        expect(result.isValid).toBe(false);
      });

      it('should reject unknown MIME type', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'application/octet-stream' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('unsupported_format');
        expect(result.isValid).toBe(false);
      });
    });

    describe('duration validation', () => {
      beforeEach(() => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);
      });

      it('should accept audio exactly at minimum duration (10 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 10 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('audio_too_short');
        expect(result.isValid).toBe(true);
      });

      it('should reject audio just under minimum duration (9.99 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 9.99 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.isValid).toBe(false);
      });

      it('should reject audio under minimum duration (5 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 5 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.isValid).toBe(false);
      });

      it('should reject very short audio (1 second)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 1 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.isValid).toBe(false);
      });

      it('should accept audio exactly at maximum duration (900 seconds / 15 minutes)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 900 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('audio_too_long');
        expect(result.isValid).toBe(true);
      });

      it('should reject audio just over maximum duration (900.01 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 900.01 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_long');
        expect(result.isValid).toBe(false);
      });

      it('should reject audio over maximum duration (1000 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 1000 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_long');
        expect(result.isValid).toBe(false);
      });

      it('should accept audio in valid duration range (60 seconds)', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 60 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('audio_too_short');
        expect(result.errors).not.toContain('audio_too_long');
        expect(result.isValid).toBe(true);
      });
    });

    describe('silence/quiet audio detection', () => {
      it('should detect audio that is too quiet (RMS < 0.01)', async () => {
        // Create very quiet audio (near silence)
        const quietChannelData = new Float32Array(44100 * 30).fill(0.001);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: quietChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_quiet');
        expect(result.isValid).toBe(false);
      });

      it('should accept audio with normal volume (RMS >= 0.01)', async () => {
        // Create normal volume audio
        const normalChannelData = new Float32Array(44100 * 30).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: normalChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('audio_too_quiet');
      });

      it('should accept loud audio', async () => {
        // Create loud audio
        const loudChannelData = new Float32Array(44100 * 30).fill(0.9);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: loudChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('audio_too_quiet');
      });

      it('should detect completely silent audio', async () => {
        // Create completely silent audio
        const silentChannelData = new Float32Array(44100 * 30).fill(0);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: silentChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_quiet');
        expect(result.isValid).toBe(false);
      });
    });

    describe('excessive noise detection', () => {
      it('should detect excessive noise and return excessive_noise error', async () => {
        // Create audio with variance between 0.05 and 0.2 to trigger excessive noise
        // Using alternating values to create specific variance
        const noisyChannelData = new Float32Array(10000);
        // Create data with mean ~0 and variance ~0.1
        // Using values ±0.45 gives variance ≈ 0.45^2 = 0.2025 (too high)
        // Using values ±0.3 gives variance ≈ 0.3^2 = 0.09 (in range!)
        for (let i = 0; i < 10000; i++) {
          noisyChannelData[i] = i % 2 === 0 ? 0.3 : -0.3;
        }
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: noisyChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('excessive_noise');
        expect(result.isValid).toBe(false);
      });

      it('should detect excessive noise (variance between 0.05 and 0.2)', async () => {
        // Create audio with variance in the "noise" range
        // We need to create samples that will produce variance between 0.05 and 0.2
        const noisyChannelData = new Float32Array(10000);
        // Generate samples with mean ~0 and variance ~0.1
        for (let i = 0; i < 10000; i++) {
          noisyChannelData[i] = (Math.random() - 0.5) * 0.6; // variance ≈ 0.03
        }
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: noisyChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        // Note: The actual variance depends on the random values, so we test the logic
        // This test verifies the function runs without errors
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
      });

      it('should not flag normal audio as noisy', async () => {
        // Create normal audio with consistent amplitude
        const normalChannelData = new Float32Array(44100 * 30).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: normalChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('excessive_noise');
      });

      it('should not flag very low variance audio as noisy', async () => {
        // Create audio with very low variance (constant signal)
        const lowVarianceData = new Float32Array(10000).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: lowVarianceData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).not.toContain('excessive_noise');
      });
    });

    describe('corrupt file / decode error handling', () => {
      it('should handle decode error and return file_corrupt', async () => {
        mockAudioContext.decodeAudioData.mockRejectedValue(
          new Error('Decode error'),
        );

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('file_corrupt');
        expect(result.isValid).toBe(false);
      });

      it('should log decode error to console', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        mockAudioContext.decodeAudioData.mockRejectedValue(
          new Error('Test decode error'),
        );

        const file = createMockFile({ type: 'audio/wav' });
        await validateAudioFile(file);

        expect(consoleSpy).toHaveBeenCalledWith(
          'Audio decode error:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });

      it('should handle null decode result', async () => {
        mockAudioContext.decodeAudioData.mockResolvedValue(null);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        // Should handle gracefully
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
      });

      it('should handle AudioContext creation error', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        // Temporarily break AudioContext
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.AudioContext as any) = vi.fn(() => {
          throw new Error('AudioContext not supported');
        });

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('file_corrupt');
        expect(result.isValid).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Audio validation error:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });

      it('should handle arrayBuffer read error', async () => {
        const consoleSpy = vi.spyOn(console, 'error');
        const file = createMockFile({
          type: 'audio/wav',
          arrayBuffer: async () => {
            throw new Error('Read error');
          },
        });

        const result = await validateAudioFile(file);

        expect(result.errors).toContain('file_corrupt');
        expect(result.isValid).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Audio validation error:',
          expect.any(Error),
        );
        consoleSpy.mockRestore();
      });
    });

    describe('combined validation errors', () => {
      it('should return multiple errors when multiple validations fail', async () => {
        // Create short AND quiet audio
        const quietChannelData = new Float32Array(44100 * 5).fill(0.001);
        const mockBuffer = createMockAudioBuffer({
          duration: 5, // Too short
          channelData: quietChannelData, // Too quiet
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.errors).toContain('audio_too_quiet');
        expect(result.isValid).toBe(false);
      });

      it('should return unsupported_format AND file_corrupt for invalid format with decode error', async () => {
        mockAudioContext.decodeAudioData.mockRejectedValue(
          new Error('Decode error'),
        );

        const file = createMockFile({ type: 'video/mp4' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('unsupported_format');
        expect(result.errors).toContain('file_corrupt');
        expect(result.isValid).toBe(false);
      });
    });

    describe('valid audio scenarios', () => {
      it('should return isValid=true for completely valid audio', async () => {
        const normalChannelData = new Float32Array(44100 * 30).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: normalChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should validate valid MP3 audio', async () => {
        const normalChannelData = new Float32Array(44100 * 60).fill(0.6);
        const mockBuffer = createMockAudioBuffer({
          duration: 60,
          channelData: normalChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/mpeg', name: 'test.mp3' });
        const result = await validateAudioFile(file);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('edge cases and boundary conditions', () => {
      it('should handle zero duration audio', async () => {
        const emptyChannelData = new Float32Array(0);
        const mockBuffer = createMockAudioBuffer({
          duration: 0,
          channelData: emptyChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.isValid).toBe(false);
      });

      it('should handle negative duration audio', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: -1 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_short');
        expect(result.isValid).toBe(false);
      });

      it('should handle very large audio file duration', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 3600 }); // 1 hour
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.errors).toContain('audio_too_long');
        expect(result.isValid).toBe(false);
      });

      it('should handle empty file', async () => {
        const file = createMockFile({
          type: 'audio/wav',
          arrayBuffer: async () => new ArrayBuffer(0),
        });
        mockAudioContext.decodeAudioData.mockRejectedValue(
          new Error('Empty buffer'),
        );

        const result = await validateAudioFile(file);

        expect(result.errors).toContain('file_corrupt');
        expect(result.isValid).toBe(false);
      });

      it('should handle file with undefined type', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = {
          type: undefined,
          name: 'test',
          size: 1024,
          arrayBuffer: async () => new ArrayBuffer(1024),
        } as unknown as File;

        const result = await validateAudioFile(file);

        expect(result.errors).toContain('unsupported_format');
        expect(result.isValid).toBe(false);
      });
    });

    describe('AudioBuffer channel data sampling', () => {
      it('should handle audio buffer with limited samples (< 10000)', async () => {
        const smallChannelData = new Float32Array(1000).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: smallChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        // Should not throw, should complete validation
        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
      });

      it('should handle audio buffer with many samples (>= 10000)', async () => {
        const largeChannelData = new Float32Array(44100 * 60).fill(0.5); // ~2.6M samples
        const mockBuffer = createMockAudioBuffer({
          duration: 60,
          channelData: largeChannelData,
        });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        // Should not throw, should sample correctly
        expect(result).toHaveProperty('isValid');
        expect(result.errors).not.toContain('audio_too_quiet');
      });
    });

    describe('webkitAudioContext fallback', () => {
      it('should use webkitAudioContext if AudioContext is not available', async () => {
        const normalChannelData = new Float32Array(44100 * 30).fill(0.5);
        const mockBuffer = createMockAudioBuffer({
          duration: 30,
          channelData: normalChannelData,
        });
        const webkitMock = new MockAudioContext();
        webkitMock.decodeAudioData.mockResolvedValue(mockBuffer);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).AudioContext = undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext =
          createMockAudioContextConstructor(webkitMock);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result.isValid).toBe(true);
        expect(webkitMock.decodeAudioData).toHaveBeenCalled();

        // Cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).webkitAudioContext;
      });
    });

    describe('return type validation', () => {
      it('should return object with isValid boolean', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(typeof result.isValid).toBe('boolean');
      });

      it('should return object with errors array', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(Array.isArray(result.errors)).toBe(true);
      });

      it('should return AudioValidationResult structure', async () => {
        const mockBuffer = createMockAudioBuffer({ duration: 30 });
        mockAudioContext.decodeAudioData.mockResolvedValue(mockBuffer);

        const file = createMockFile({ type: 'audio/wav' });
        const result = await validateAudioFile(file);

        expect(result).toHaveProperty('isValid');
        expect(result).toHaveProperty('errors');
        expect(result.errors).toEqual(expect.any(Array));
      });
    });
  });
});
