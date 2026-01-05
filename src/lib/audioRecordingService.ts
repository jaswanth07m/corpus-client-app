import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface AudioRecordingServiceResult {
  success: boolean;
  file?: File;
  duration?: number;
  mimeType?: string;
  error?: string;
}

export interface AudioRecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
}

class AudioRecordingService {
  private isRecording = false;
  private isPaused = false;
  private recordingStartTime: number = 0;

  async canRecord(): Promise<boolean> {
    try {
      const result = await VoiceRecorder.canDeviceVoiceRecord();
      return result.value;
    } catch (error) {
      console.error('Error checking recording capability:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const result = await VoiceRecorder.requestAudioRecordingPermission();
      return result.value;
    } catch (error) {
      console.error('Error requesting recording permission:', error);
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const result = await VoiceRecorder.hasAudioRecordingPermission();
      return result.value;
    } catch (error) {
      console.error('Error checking recording permission:', error);
      return false;
    }
  }

  async startRecording(options?: {
    directory?: Directory;
    subDirectory?: string;
  }): Promise<AudioRecordingServiceResult> {
    try {
      if (this.isRecording) {
        return {
          success: false,
          error: 'Recording is already in progress',
        };
      }

      const hasPerm = await this.hasPermission();
      if (!hasPerm) {
        const granted = await this.requestPermission();
        if (!granted) {
          return {
            success: false,
            error: 'Microphone permission denied',
          };
        }
      }

      const startOptions = options?.directory
        ? {
            directory: options.directory,
            subDirectory: options.subDirectory,
          }
        : undefined;

      const result = await VoiceRecorder.startRecording(startOptions);

      if (result.value) {
        this.isRecording = true;
        this.isPaused = false;
        this.recordingStartTime = Date.now();

        return {
          success: true,
        };
      }

      return {
        success: false,
        error: 'Failed to start recording',
      };
    } catch (error) {
      console.error('Error starting recording:', error);

      let errorMessage = 'Failed to start recording';
      if (error instanceof Error && error.message) {
        if (error.message.includes('MISSING_PERMISSION')) {
          errorMessage = 'Microphone permission is required';
        } else if (error.message.includes('DEVICE_CANNOT_VOICE_RECORD')) {
          errorMessage = 'Device cannot record audio';
        } else if (error.message.includes('ALREADY_RECORDING')) {
          errorMessage = 'Recording is already in progress';
        } else if (error.message.includes('MICROPHONE_BEING_USED')) {
          errorMessage = 'Microphone is being used by another app';
        } else if (error.message.includes('FAILED_TO_RECORD')) {
          errorMessage = 'Failed to start recording. Please try again.';
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async pauseRecording(): Promise<AudioRecordingServiceResult> {
    try {
      if (!this.isRecording) {
        return {
          success: false,
          error: 'No recording in progress',
        };
      }

      if (this.isPaused) {
        return {
          success: false,
          error: 'Recording is already paused',
        };
      }

      const result = await VoiceRecorder.pauseRecording();

      if (result.value) {
        this.isPaused = true;
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: 'Failed to pause recording',
      };
    } catch (error) {
      console.error('Error pausing recording:', error);
      return {
        success: false,
        error: 'Failed to pause recording',
      };
    }
  }

  async resumeRecording(): Promise<AudioRecordingServiceResult> {
    try {
      if (!this.isRecording) {
        return {
          success: false,
          error: 'No recording in progress',
        };
      }

      if (!this.isPaused) {
        return {
          success: false,
          error: 'Recording is not paused',
        };
      }

      const result = await VoiceRecorder.resumeRecording();

      if (result.value) {
        this.isPaused = false;
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: 'Failed to resume recording',
      };
    } catch (error) {
      console.error('Error resuming recording:', error);
      return {
        success: false,
        error: 'Failed to resume recording',
      };
    }
  }

  async stopRecording(options?: {
    directory?: Directory;
    subDirectory?: string;
  }): Promise<AudioRecordingServiceResult> {
    try {
      if (!this.isRecording) {
        return {
          success: false,
          error: 'No recording in progress',
        };
      }

      const recordingData = await VoiceRecorder.stopRecording();

      this.isRecording = false;
      this.isPaused = false;

      let file: File | undefined;
      let mimeType: string | undefined;
      let duration: number | undefined;

      if (recordingData.value) {
        duration = recordingData.value.msDuration || 0;
        mimeType = recordingData.value.mimeType || 'audio/aac';

        if (recordingData.value.recordDataBase64) {
          const base64Data = recordingData.value.recordDataBase64;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          file = new File([blob], `audio-recording-${timestamp}.m4a`, {
            type: mimeType,
          });
        } else if (recordingData.value.path && options?.directory) {
          const fileData = await Filesystem.readFile({
            directory: options.directory,
            path: recordingData.value.path,
          });

          if (fileData.data) {
            let blob: Blob;

            if (typeof fileData.data === 'string') {
              const byteCharacters = atob(fileData.data);
              const byteNumbers = new Array(byteCharacters.length);

              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }

              const byteArray = new Uint8Array(byteNumbers);
              blob = new Blob([byteArray], { type: mimeType });
            } else if (fileData.data instanceof Blob) {
              blob = fileData.data;
            } else {
              throw new Error('Unsupported data format');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            file = new File([blob], `audio-recording-${timestamp}.m4a`, {
              type: mimeType,
            });
          }
        }
      }

      if (file) {
        return {
          success: true,
          file,
          duration,
          mimeType,
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve recording',
      };
    } catch (error) {
      console.error('Error stopping recording:', error);

      this.isRecording = false;
      this.isPaused = false;

      let errorMessage = 'Failed to stop recording';
      if (error instanceof Error && error.message) {
        if (error.message.includes('RECORDING_HAS_NOT_STARTED')) {
          errorMessage = 'No recording in progress';
        } else if (error.message.includes('EMPTY_RECORDING')) {
          errorMessage = 'Recording was too short';
        } else if (error.message.includes('FAILED_TO_FETCH_RECORDING')) {
          errorMessage = 'Failed to retrieve recording';
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async getCurrentStatus(): Promise<AudioRecordingStatus> {
    try {
      const result = await VoiceRecorder.getCurrentStatus();

      switch (result.status) {
        case 'RECORDING':
          return { isRecording: true, isPaused: false };
        case 'PAUSED':
          return { isRecording: true, isPaused: true };
        case 'NONE':
        default:
          return { isRecording: false, isPaused: false };
      }
    } catch (error) {
      console.error('Error getting recording status:', error);
      return { isRecording: false, isPaused: false };
    }
  }

  getRecordingDuration(): number {
    if (!this.isRecording || this.recordingStartTime === 0) {
      return 0;
    }

    const elapsed = Date.now() - this.recordingStartTime;
    return Math.floor(elapsed / 1000);
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }
}

export const audioRecordingService = new AudioRecordingService();
