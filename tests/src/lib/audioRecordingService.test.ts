import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  Filesystem: {
    readFile: vi.fn(),
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    Cache: 'CACHE',
    External: 'EXTERNAL',
    ExternalStorage: 'EXTERNAL_STORAGE',
  },
}));

import { VoiceRecorder } from 'capacitor-voice-recorder';
import { audioRecordingService } from '../../../src/lib/audioRecordingService';

describe('AudioRecordingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── canRecord ───────────────────────────────────────────────────
  describe('canRecord', () => {
    it('returns true when device can record', async () => {
      (
        VoiceRecorder.canDeviceVoiceRecord as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      const result = await audioRecordingService.canRecord();
      expect(result).toBe(true);
    });

    it('returns false when device cannot record', async () => {
      (
        VoiceRecorder.canDeviceVoiceRecord as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: false });
      const result = await audioRecordingService.canRecord();
      expect(result).toBe(false);
    });

    it('returns false when an error is thrown', async () => {
      (
        VoiceRecorder.canDeviceVoiceRecord as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error('Error'));
      const result = await audioRecordingService.canRecord();
      expect(result).toBe(false);
    });
  });

  // ─── requestPermission ───────────────────────────────────────────
  describe('requestPermission', () => {
    it('returns true when permission granted', async () => {
      (
        VoiceRecorder.requestAudioRecordingPermission as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ value: true });
      const result = await audioRecordingService.requestPermission();
      expect(result).toBe(true);
    });

    it('returns false when permission denied', async () => {
      (
        VoiceRecorder.requestAudioRecordingPermission as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ value: false });
      const result = await audioRecordingService.requestPermission();
      expect(result).toBe(false);
    });

    it('returns false on error', async () => {
      (
        VoiceRecorder.requestAudioRecordingPermission as ReturnType<
          typeof vi.fn
        >
      ).mockRejectedValue(new Error('Permission error'));
      const result = await audioRecordingService.requestPermission();
      expect(result).toBe(false);
    });
  });

  // ─── hasPermission ───────────────────────────────────────────────
  describe('hasPermission', () => {
    it('returns true when has permission', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      const result = await audioRecordingService.hasPermission();
      expect(result).toBe(true);
    });

    it('returns false when no permission', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: false });
      const result = await audioRecordingService.hasPermission();
      expect(result).toBe(false);
    });
  });

  // ─── startRecording ──────────────────────────────────────────────
  describe.skip('startRecording', () => {
    it('succeeds when has permission and VoiceRecorder starts', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      (
        VoiceRecorder.startRecording as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });

      const result = await audioRecordingService.startRecording();
      expect(result.success).toBe(true);
    });

    it('requests permission if not already granted, then starts', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: false });
      (
        VoiceRecorder.requestAudioRecordingPermission as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ value: true });
      (
        VoiceRecorder.startRecording as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });

      const result = await audioRecordingService.startRecording();
      expect(result.success).toBe(true);
    });

    it('fails when permission is denied', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: false });
      (
        VoiceRecorder.requestAudioRecordingPermission as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({ value: false });

      const result = await audioRecordingService.startRecording();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Microphone permission denied');
    });

    it('fails when VoiceRecorder.startRecording returns false', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      (
        VoiceRecorder.startRecording as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: false });

      const result = await audioRecordingService.startRecording();
      expect(result.success).toBe(false);
    });

    it('handles MISSING_PERMISSION error message', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      (
        VoiceRecorder.startRecording as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error('MISSING_PERMISSION'));

      const result = await audioRecordingService.startRecording();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Microphone permission is required');
    });

    it('handles ALREADY_RECORDING error message', async () => {
      (
        VoiceRecorder.hasAudioRecordingPermission as ReturnType<typeof vi.fn>
      ).mockResolvedValue({ value: true });
      (
        VoiceRecorder.startRecording as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error('ALREADY_RECORDING'));

      const result = await audioRecordingService.startRecording();
      expect(result.error).toBe('Recording is already in progress');
    });
  });

  // ─── pauseRecording ──────────────────────────────────────────────
  describe.skip('pauseRecording', () => {
    it('fails when no recording is in progress', async () => {
      // Fresh service instance has isRecording = false
      const result = await audioRecordingService.pauseRecording();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });
  });

  // ─── resumeRecording ─────────────────────────────────────────────
  describe.skip('resumeRecording', () => {
    it('fails when no recording is in progress', async () => {
      const result = await audioRecordingService.resumeRecording();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });
  });

  // ─── stopRecording ───────────────────────────────────────────────
  describe.skip('stopRecording', () => {
    it('fails when no recording is in progress', async () => {
      const result = await audioRecordingService.stopRecording();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No recording in progress');
    });
  });

  // ─── getCurrentStatus ────────────────────────────────────────────
  describe('getCurrentStatus', () => {
    it('returns isRecording: true when status is RECORDING', async () => {
      (
        VoiceRecorder.getCurrentStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        status: 'RECORDING',
      });
      const status = await audioRecordingService.getCurrentStatus();
      expect(status.isRecording).toBe(true);
      expect(status.isPaused).toBe(false);
    });

    it('returns isRecording: true, isPaused: true when status is PAUSED', async () => {
      (
        VoiceRecorder.getCurrentStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        status: 'PAUSED',
      });
      const status = await audioRecordingService.getCurrentStatus();
      expect(status.isRecording).toBe(true);
      expect(status.isPaused).toBe(true);
    });

    it('returns isRecording: false when status is NONE', async () => {
      (
        VoiceRecorder.getCurrentStatus as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        status: 'NONE',
      });
      const status = await audioRecordingService.getCurrentStatus();
      expect(status.isRecording).toBe(false);
      expect(status.isPaused).toBe(false);
    });

    it('returns isRecording: false on error', async () => {
      (
        VoiceRecorder.getCurrentStatus as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error('Status error'));
      const status = await audioRecordingService.getCurrentStatus();
      expect(status.isRecording).toBe(false);
    });
  });

  // ─── getRecordingDuration ────────────────────────────────────────
  describe('getRecordingDuration', () => {
    it('returns 0 when not recording', () => {
      const duration = audioRecordingService.getRecordingDuration();
      expect(duration).toBe(0);
    });
  });

  // ─── isCurrentlyRecording / isCurrentlyPaused ────────────────────
  describe('state getters', () => {
    it('isCurrentlyRecording returns false initially', () => {
      expect(audioRecordingService.isCurrentlyRecording()).toBe(false);
    });

    it('isCurrentlyPaused returns false initially', () => {
      expect(audioRecordingService.isCurrentlyPaused()).toBe(false);
    });
  });
});
