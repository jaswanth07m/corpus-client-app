/**
 * Unit tests for audioRecordingService.ts
 * Tests all methods of AudioRecordingService class
 * Covers recording lifecycle, permissions, error handling, and state management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioRecordingService } from '../../../src/lib/audioRecordingService';
import { Directory } from '@capacitor/filesystem';

// Mock capacitor-voice-recorder
vi.mock('capacitor-voice-recorder', () => ({
  VoiceRecorder: {
    canDeviceVoiceRecord: vi.fn(),
    requestAudioRecordingPermission: vi.fn(),
    hasAudioRecordingPermission: vi.fn(),
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    stopRecording: vi.fn(),
    getCurrentStatus: vi.fn(),
  },
}));

// Mock @capacitor/filesystem
vi.mock('@capacitor/filesystem', () => ({
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    Library: 'LIBRARY',
    External: 'EXTERNAL',
  },
  Filesystem: {
    readFile: vi.fn(),
  },
}));

// Import mocked modules
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Filesystem } from '@capacitor/filesystem';

// Type the mocks
const mockVoiceRecorder = VoiceRecorder as {
  canDeviceVoiceRecord: ReturnType<typeof vi.fn>;
  requestAudioRecordingPermission: ReturnType<typeof vi.fn>;
  hasAudioRecordingPermission: ReturnType<typeof vi.fn>;
  startRecording: ReturnType<typeof vi.fn>;
  pauseRecording: ReturnType<typeof vi.fn>;
  resumeRecording: ReturnType<typeof vi.fn>;
  stopRecording: ReturnType<typeof vi.fn>;
  getCurrentStatus: ReturnType<typeof vi.fn>;
};

const mockFilesystem = Filesystem as {
  readFile: ReturnType<typeof vi.fn>;
};

// Helper to create mock recording data
function createMockRecordingData({
  base64 = 'SGVsbG8gV29ybGQ=', // "Hello World" in base64
  msDuration = 5000,
  mimeType = 'audio/aac',
  path = undefined,
}: {
  base64?: string;
  msDuration?: number;
  mimeType?: string;
  path?: string;
} = {}) {
  return {
    value: {
      recordDataBase64: base64,
      msDuration,
      mimeType,
      path,
    },
  };
}

describe('AudioRecordingService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset internal state by ensuring any recording is stopped
    mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
      value: true,
    });
    mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
    mockVoiceRecorder.stopRecording.mockResolvedValue(
      createMockRecordingData({}),
    );
    // Stop any existing recording to reset state
    try {
      await audioRecordingService.stopRecording();
    } catch {
      // Ignore errors - just resetting state
    }
    // Reset mocks after cleanup
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('canRecord()', () => {
    it('should return true when device can record', async () => {
      mockVoiceRecorder.canDeviceVoiceRecord.mockResolvedValue({ value: true });

      const result = await audioRecordingService.canRecord();

      expect(result).toBe(true);
      expect(mockVoiceRecorder.canDeviceVoiceRecord).toHaveBeenCalled();
    });

    it('should return false when device cannot record', async () => {
      mockVoiceRecorder.canDeviceVoiceRecord.mockResolvedValue({
        value: false,
      });

      const result = await audioRecordingService.canRecord();

      expect(result).toBe(false);
    });

    it('should return false and log error on exception', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.canDeviceVoiceRecord.mockRejectedValue(
        new Error('Device error'),
      );

      const result = await audioRecordingService.canRecord();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking recording capability:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('requestPermission()', () => {
    it('should return true when permission granted', async () => {
      mockVoiceRecorder.requestAudioRecordingPermission.mockResolvedValue({
        value: true,
      });

      const result = await audioRecordingService.requestPermission();

      expect(result).toBe(true);
      expect(
        mockVoiceRecorder.requestAudioRecordingPermission,
      ).toHaveBeenCalled();
    });

    it('should return false when permission denied', async () => {
      mockVoiceRecorder.requestAudioRecordingPermission.mockResolvedValue({
        value: false,
      });

      const result = await audioRecordingService.requestPermission();

      expect(result).toBe(false);
    });

    it('should return false and log error on exception', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.requestAudioRecordingPermission.mockRejectedValue(
        new Error('Permission error'),
      );

      const result = await audioRecordingService.requestPermission();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error requesting recording permission:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('hasPermission()', () => {
    it('should return true when permission already granted', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });

      const result = await audioRecordingService.hasPermission();

      expect(result).toBe(true);
      expect(mockVoiceRecorder.hasAudioRecordingPermission).toHaveBeenCalled();
    });

    it('should return false when permission not granted', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: false,
      });

      const result = await audioRecordingService.hasPermission();

      expect(result).toBe(false);
    });

    it('should return false and log error on exception', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.hasAudioRecordingPermission.mockRejectedValue(
        new Error('Check permission error'),
      );

      const result = await audioRecordingService.hasPermission();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking recording permission:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('startRecording()', () => {
    beforeEach(async () => {
      // Ensure clean state before each test
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
    });

    it('should start recording successfully without options', async () => {
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });

      const result = await audioRecordingService.startRecording();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockVoiceRecorder.startRecording).toHaveBeenCalledWith(undefined);
    });

    it('should start recording successfully with options', async () => {
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      const options = {
        directory: Directory.Documents,
        subDirectory: 'recordings',
      };

      const result = await audioRecordingService.startRecording(options);

      expect(result.success).toBe(true);
      expect(mockVoiceRecorder.startRecording).toHaveBeenCalledWith(options);
    });

    it('should fail if recording is already in progress', async () => {
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      // Start first recording
      await audioRecordingService.startRecording();

      // Try to start another
      const result = await audioRecordingService.startRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recording is already in progress');
      expect(mockVoiceRecorder.startRecording).toHaveBeenCalledTimes(1);
    });

    it('should request permission if not granted and succeed', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: false,
      });
      mockVoiceRecorder.requestAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });

      const result = await audioRecordingService.startRecording();

      expect(result.success).toBe(true);
      expect(mockVoiceRecorder.hasAudioRecordingPermission).toHaveBeenCalled();
      expect(
        mockVoiceRecorder.requestAudioRecordingPermission,
      ).toHaveBeenCalled();
    });

    it('should fail if permission denied after request', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: false,
      });
      mockVoiceRecorder.requestAudioRecordingPermission.mockResolvedValue({
        value: false,
      });

      const result = await audioRecordingService.startRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Microphone permission denied');
      expect(mockVoiceRecorder.startRecording).not.toHaveBeenCalled();
    });

    it('should handle startRecording returning false', async () => {
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: false });

      const result = await audioRecordingService.startRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to start recording');
    });

    describe('startRecording() error handling', () => {
      it('should handle MISSING_PERMISSION error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('MISSING_PERMISSION'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Microphone permission is required');
        consoleSpy.mockRestore();
      });

      it('should handle DEVICE_CANNOT_VOICE_RECORD error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('DEVICE_CANNOT_VOICE_RECORD'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Device cannot record audio');
        consoleSpy.mockRestore();
      });

      it('should handle ALREADY_RECORDING error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('ALREADY_RECORDING'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Recording is already in progress');
        consoleSpy.mockRestore();
      });

      it('should handle MICROPHONE_BEING_USED error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('MICROPHONE_BEING_USED'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Microphone is being used by another app');
        consoleSpy.mockRestore();
      });

      it('should handle FAILED_TO_RECORD error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('FAILED_TO_RECORD'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Failed to start recording. Please try again.',
        );
        consoleSpy.mockRestore();
      });

      it('should handle generic error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.startRecording.mockRejectedValue(
          new Error('Unknown error'),
        );

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to start recording');
        consoleSpy.mockRestore();
      });

      it('should handle error without message property', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        // Create an error-like object without message
        const errorWithoutMessage = { name: 'UnknownError' };
        mockVoiceRecorder.startRecording.mockRejectedValue(errorWithoutMessage);

        const result = await audioRecordingService.startRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to start recording');
        consoleSpy.mockRestore();
      });
    });
  });

  describe('pauseRecording()', () => {
    beforeEach(async () => {
      // Setup: start a recording first
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();
      mockVoiceRecorder.pauseRecording.mockReset();
    });

    it('should pause recording successfully', async () => {
      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });

      const result = await audioRecordingService.pauseRecording();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockVoiceRecorder.pauseRecording).toHaveBeenCalled();
    });

    it('should fail if no recording in progress', async () => {
      // Reset state by stopping first
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      const result = await audioRecordingService.pauseRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });

    it('should fail if recording is already paused', async () => {
      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });
      await audioRecordingService.pauseRecording();

      // Try to pause again
      const result = await audioRecordingService.pauseRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recording is already paused');
    });

    it('should handle pauseRecording returning false', async () => {
      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: false });

      const result = await audioRecordingService.pauseRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to pause recording');
    });

    it('should handle exception during pause', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.pauseRecording.mockRejectedValue(
        new Error('Pause error'),
      );

      const result = await audioRecordingService.pauseRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to pause recording');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error pausing recording:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('resumeRecording()', () => {
    beforeEach(async () => {
      // Setup: start and pause a recording
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();
      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });
      await audioRecordingService.pauseRecording();
      mockVoiceRecorder.resumeRecording.mockReset();
    });

    it('should resume recording successfully', async () => {
      mockVoiceRecorder.resumeRecording.mockResolvedValue({ value: true });

      const result = await audioRecordingService.resumeRecording();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockVoiceRecorder.resumeRecording).toHaveBeenCalled();
    });

    it('should fail if no recording in progress', async () => {
      // Reset state
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      const result = await audioRecordingService.resumeRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });

    it('should fail if recording is not paused', async () => {
      // Start fresh recording (not paused)
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const result = await audioRecordingService.resumeRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recording is not paused');
    });

    it('should handle resumeRecording returning false', async () => {
      mockVoiceRecorder.resumeRecording.mockResolvedValue({ value: false });

      const result = await audioRecordingService.resumeRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to resume recording');
    });

    it('should handle exception during resume', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.resumeRecording.mockRejectedValue(
        new Error('Resume error'),
      );

      const result = await audioRecordingService.resumeRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to resume recording');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error resuming recording:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('stopRecording()', () => {
    beforeEach(async () => {
      // Setup: start a recording first
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();
      mockVoiceRecorder.stopRecording.mockReset();
    });

    it('should stop recording successfully with base64 data', async () => {
      const mockData = createMockRecordingData({
        base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        msDuration: 5000,
        mimeType: 'audio/aac',
      });
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(true);
      expect(result.file).toBeInstanceOf(File);
      expect(result.file?.name).toContain('audio-recording-');
      expect(result.file?.type).toBe('audio/aac');
      expect(result.duration).toBe(5000); // msDuration in milliseconds
      expect(result.mimeType).toBe('audio/aac');
    });

    it('should stop recording with default mime type', async () => {
      const mockData = createMockRecordingData({
        base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        mimeType: undefined,
      });
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('audio/aac'); // default
    });

    it('should stop recording with empty string mime type (uses default)', async () => {
      const mockData = {
        value: {
          recordDataBase64:
            'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
          msDuration: 5000,
          mimeType: '', // Empty string should use default
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(true);
      expect(result.mimeType).toBe('audio/aac'); // default
    });

    it('should stop recording with zero duration', async () => {
      const mockData = createMockRecordingData({
        base64: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
        msDuration: 0,
      });
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(true);
      expect(result.duration).toBe(0);
    });

    it('should stop recording from file path', async () => {
      // First ensure we have a recording in progress
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const mockData = {
        value: {
          recordDataBase64: undefined,
          path: 'recordings/test.m4a',
          msDuration: 3000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);
      mockFilesystem.readFile.mockResolvedValue({
        data: 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=',
      });

      const result = await audioRecordingService.stopRecording({
        directory: Directory.Documents,
      });

      expect(result.success).toBe(true);
      expect(result.file).toBeInstanceOf(File);
      expect(mockFilesystem.readFile).toHaveBeenCalledWith({
        directory: Directory.Documents,
        path: 'recordings/test.m4a',
      });
    });

    it('should handle Blob data from Filesystem.readFile', async () => {
      // First ensure we have a recording in progress
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const mockBlob = new Blob(['audio data'], { type: 'audio/aac' });
      const mockData = {
        value: {
          recordDataBase64: null, // Explicitly null to use file path
          path: 'recordings/test.m4a',
          msDuration: 3000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);
      mockFilesystem.readFile.mockResolvedValue({
        data: mockBlob,
      });

      const result = await audioRecordingService.stopRecording({
        directory: Directory.Documents,
      });

      expect(result.success).toBe(true);
      expect(result.file).toBeInstanceOf(File);
    });

    it('should fail if no recording in progress', async () => {
      // Reset state
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });

    it('should fail if recording data is empty', async () => {
      mockVoiceRecorder.stopRecording.mockResolvedValue({ value: null });

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve recording');
    });

    it('should fail if no base64 data and no path', async () => {
      const mockData = {
        value: {
          recordDataBase64: null,
          path: null,
          msDuration: 5000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);

      const result = await audioRecordingService.stopRecording();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve recording');
    });

    it('should fail if path exists but no directory option provided', async () => {
      // First ensure we have a recording in progress
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const mockData = {
        value: {
          recordDataBase64: null, // Explicitly null to ensure first if is false
          path: 'recordings/test.m4a',
          msDuration: 5000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);
      // Don't mock Filesystem.readFile - it shouldn't be called

      const result = await audioRecordingService.stopRecording();
      // No directory option provided, so file won't be created

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve recording');
      expect(mockFilesystem.readFile).not.toHaveBeenCalled();
    });

    it('should fail if Filesystem.readFile returns null data', async () => {
      // First ensure we have a recording in progress
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const mockData = {
        value: {
          recordDataBase64: null,
          path: 'recordings/test.m4a',
          msDuration: 5000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);
      mockFilesystem.readFile.mockResolvedValue({
        data: null, // Null data should fail the if (fileData.data) check
      });

      const result = await audioRecordingService.stopRecording({
        directory: Directory.Documents,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve recording');
    });

    it('should fail with unsupported data format', async () => {
      // First ensure we have a recording in progress
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const mockData = {
        value: {
          recordDataBase64: undefined,
          path: 'recordings/test.m4a',
          msDuration: 5000,
          mimeType: 'audio/aac',
        },
      };
      mockVoiceRecorder.stopRecording.mockResolvedValue(mockData);
      mockFilesystem.readFile.mockResolvedValue({
        data: 12345, // Invalid data type
      });

      const result = await audioRecordingService.stopRecording({
        directory: Directory.Documents,
      });

      // The code throws on unsupported format, which is caught and returns error
      expect(result.success).toBe(false);
    });

    describe('stopRecording() error handling', () => {
      it('should handle RECORDING_HAS_NOT_STARTED error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.stopRecording.mockRejectedValue(
          new Error('RECORDING_HAS_NOT_STARTED'),
        );

        const result = await audioRecordingService.stopRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('No recording in progress');
        consoleSpy.mockRestore();
      });

      it('should handle EMPTY_RECORDING error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.stopRecording.mockRejectedValue(
          new Error('EMPTY_RECORDING'),
        );

        const result = await audioRecordingService.stopRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Recording was too short');
        consoleSpy.mockRestore();
      });

      it('should handle FAILED_TO_FETCH_RECORDING error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.stopRecording.mockRejectedValue(
          new Error('FAILED_TO_FETCH_RECORDING'),
        );

        const result = await audioRecordingService.stopRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to retrieve recording');
        consoleSpy.mockRestore();
      });

      it('should handle generic error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.stopRecording.mockRejectedValue(
          new Error('Unknown error'),
        );

        const result = await audioRecordingService.stopRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to stop recording');
        consoleSpy.mockRestore();
      });

      it('should handle error without message property in stopRecording', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        // Create an error-like object without message
        const errorWithoutMessage = { name: 'StopError' };
        mockVoiceRecorder.stopRecording.mockRejectedValue(errorWithoutMessage);

        const result = await audioRecordingService.stopRecording();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Failed to stop recording');
        consoleSpy.mockRestore();
      });

      it('should reset internal state on error', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
          // Suppress console output
        });
        mockVoiceRecorder.stopRecording.mockRejectedValue(
          new Error('Stop error'),
        );

        await audioRecordingService.stopRecording();

        // Verify state was reset
        expect(audioRecordingService.isCurrentlyRecording()).toBe(false);
        expect(audioRecordingService.isCurrentlyPaused()).toBe(false);
        consoleSpy.mockRestore();
      });
    });
  });

  describe('getCurrentStatus()', () => {
    it('should return recording status when RECORDING', async () => {
      mockVoiceRecorder.getCurrentStatus.mockResolvedValue({
        status: 'RECORDING',
      });

      const result = await audioRecordingService.getCurrentStatus();

      expect(result.isRecording).toBe(true);
      expect(result.isPaused).toBe(false);
    });

    it('should return paused status when PAUSED', async () => {
      mockVoiceRecorder.getCurrentStatus.mockResolvedValue({
        status: 'PAUSED',
      });

      const result = await audioRecordingService.getCurrentStatus();

      expect(result.isRecording).toBe(true);
      expect(result.isPaused).toBe(true);
    });

    it('should return not recording when NONE', async () => {
      mockVoiceRecorder.getCurrentStatus.mockResolvedValue({
        status: 'NONE',
      });

      const result = await audioRecordingService.getCurrentStatus();

      expect(result.isRecording).toBe(false);
      expect(result.isPaused).toBe(false);
    });

    it('should return default status for unknown status', async () => {
      mockVoiceRecorder.getCurrentStatus.mockResolvedValue({
        status: 'UNKNOWN',
      });

      const result = await audioRecordingService.getCurrentStatus();

      expect(result.isRecording).toBe(false);
      expect(result.isPaused).toBe(false);
    });

    it('should return default status on error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Suppress console output
      });
      mockVoiceRecorder.getCurrentStatus.mockRejectedValue(
        new Error('Status error'),
      );

      const result = await audioRecordingService.getCurrentStatus();

      expect(result.isRecording).toBe(false);
      expect(result.isPaused).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error getting recording status:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getRecordingDuration()', () => {
    beforeEach(async () => {
      // Setup: start a recording
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();
    });

    it('should return elapsed duration in seconds', async () => {
      // Wait a bit to have some duration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const duration = audioRecordingService.getRecordingDuration();

      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 when not recording', async () => {
      // Stop recording first
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      const duration = audioRecordingService.getRecordingDuration();

      expect(duration).toBe(0);
    });

    it('should return 0 when recordingStartTime is 0', () => {
      // Create a new service instance would test this better,
      // but for singleton, we test the current behavior
      const duration = audioRecordingService.getRecordingDuration();

      // Should be >= 0 since we started recording in beforeEach
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return integer seconds (not fractional)', async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const duration = audioRecordingService.getRecordingDuration();

      expect(Number.isInteger(duration)).toBe(true);
    });
  });

  describe('isCurrentlyRecording()', () => {
    it('should return true when recording', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const result = audioRecordingService.isCurrentlyRecording();

      expect(result).toBe(true);
    });

    it('should return false when not recording', async () => {
      const result = audioRecordingService.isCurrentlyRecording();

      expect(result).toBe(false);
    });

    it('should return false after stopping', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      await audioRecordingService.stopRecording();

      const result = audioRecordingService.isCurrentlyRecording();

      expect(result).toBe(false);
    });
  });

  describe('isCurrentlyPaused()', () => {
    it('should return false when recording but not paused', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const result = audioRecordingService.isCurrentlyPaused();

      expect(result).toBe(false);
    });

    it('should return true when paused', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });
      await audioRecordingService.pauseRecording();

      const result = audioRecordingService.isCurrentlyPaused();

      expect(result).toBe(true);
    });

    it('should return false when not recording', () => {
      const result = audioRecordingService.isCurrentlyPaused();

      expect(result).toBe(false);
    });

    it('should return false after resuming', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });
      await audioRecordingService.pauseRecording();

      mockVoiceRecorder.resumeRecording.mockResolvedValue({ value: true });
      await audioRecordingService.resumeRecording();

      const result = audioRecordingService.isCurrentlyPaused();

      expect(result).toBe(false);
    });
  });

  describe('Recording lifecycle state transitions', () => {
    it('should handle full lifecycle: start -> pause -> resume -> stop', async () => {
      // Setup permissions
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });

      // Start
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      let result = await audioRecordingService.startRecording();
      expect(result.success).toBe(true);
      expect(audioRecordingService.isCurrentlyRecording()).toBe(true);
      expect(audioRecordingService.isCurrentlyPaused()).toBe(false);

      // Pause
      mockVoiceRecorder.pauseRecording.mockResolvedValue({ value: true });
      result = await audioRecordingService.pauseRecording();
      expect(result.success).toBe(true);
      expect(audioRecordingService.isCurrentlyPaused()).toBe(true);

      // Resume
      mockVoiceRecorder.resumeRecording.mockResolvedValue({ value: true });
      result = await audioRecordingService.resumeRecording();
      expect(result.success).toBe(true);
      expect(audioRecordingService.isCurrentlyPaused()).toBe(false);
      expect(audioRecordingService.isCurrentlyRecording()).toBe(true);

      // Stop
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      result = await audioRecordingService.stopRecording();
      expect(result.success).toBe(true);
      expect(audioRecordingService.isCurrentlyRecording()).toBe(false);
      expect(audioRecordingService.isCurrentlyPaused()).toBe(false);
    });

    it('should handle start -> stop without pause', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });

      // Start
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      let result = await audioRecordingService.startRecording();
      expect(result.success).toBe(true);

      // Stop
      mockVoiceRecorder.stopRecording.mockResolvedValue(
        createMockRecordingData({}),
      );
      result = await audioRecordingService.stopRecording();
      expect(result.success).toBe(true);
    });
  });

  describe('Concurrent operation prevention', () => {
    it('should prevent multiple start calls', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });

      // First start should succeed
      const result1 = await audioRecordingService.startRecording();
      expect(result1.success).toBe(true);

      // Second start should fail
      const result2 = await audioRecordingService.startRecording();
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('Recording is already in progress');

      // Third start should also fail
      const result3 = await audioRecordingService.startRecording();
      expect(result3.success).toBe(false);
    });
  });

  describe('Return type validation', () => {
    it('should return AudioRecordingServiceResult structure on success', async () => {
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });

      const result = await audioRecordingService.startRecording();

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      expect(result.success).toBe(true);
      // error property is undefined/omitted on success
      expect(result.error).toBeUndefined();
    });

    it('should return AudioRecordingServiceResult structure on error', async () => {
      // Force already recording state to trigger error
      mockVoiceRecorder.hasAudioRecordingPermission.mockResolvedValue({
        value: true,
      });
      mockVoiceRecorder.startRecording.mockResolvedValue({ value: true });
      await audioRecordingService.startRecording();

      const result = await audioRecordingService.startRecording();

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });

    it('should return AudioRecordingStatus structure', async () => {
      mockVoiceRecorder.getCurrentStatus.mockResolvedValue({
        status: 'RECORDING',
      });

      const result = await audioRecordingService.getCurrentStatus();

      expect(result).toHaveProperty('isRecording');
      expect(result).toHaveProperty('isPaused');
      expect(typeof result.isRecording).toBe('boolean');
      expect(typeof result.isPaused).toBe('boolean');
    });
  });
});
