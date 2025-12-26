import {
  VideoRecorder,
  VideoRecorderCamera,
  VideoRecorderQuality,
} from '@capacitor-community/video-recorder';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface VideoRecordingServiceResult {
  success: boolean;
  file?: File;
  duration?: number;
  videoUrl?: string;
  error?: string;
  stream?: MediaStream;
}

export interface VideoRecordingStatus {
  isRecording: boolean;
  isInitialized: boolean;
}

class VideoRecordingService {
  private isInitialized = false;
  private isRecording = false;
  private recordingStartTime: number = 0;
  private currentCamera: VideoRecorderCamera = VideoRecorderCamera.BACK;
  private currentQuality: VideoRecorderQuality = VideoRecorderQuality.MAX_720P;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: BlobPart[] = [];

  private getPlatform(): string {
    return Capacitor.getPlatform();
  }

  private isWeb(): boolean {
    return this.getPlatform() === 'web';
  }

  async initialize(options?: {
    camera?: VideoRecorderCamera;
    quality?: VideoRecorderQuality;
    width?: number | 'fill';
    height?: number | 'fill';
  }): Promise<VideoRecordingServiceResult> {
    try {
      if (this.isInitialized) {
        return {
          success: false,
          error: 'Camera is already initialized',
        };
      }

      this.currentCamera = options?.camera || VideoRecorderCamera.BACK;
      this.currentQuality = options?.quality || VideoRecorderQuality.MAX_720P;

      if (this.isWeb()) {
        this.isInitialized = true;
        return {
          success: true,
        };
      }

      await VideoRecorder.initialize({
        camera: this.currentCamera,
        quality: this.currentQuality,
        previewFrames: [
          {
            id: 'video-preview',
            stackPosition: 'back',
            width: options?.width || 'fill',
            height: options?.height || 'fill',
            x: 0,
            y: 0,
            borderRadius: 0,
          },
        ],
      });

      this.isInitialized = true;
      return {
        success: true,
      };
    } catch (error) {
      console.error('Error initializing camera:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize camera',
      };
    }
  }

  async startRecording(): Promise<VideoRecordingServiceResult> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Camera is not initialized',
        };
      }

      if (this.isRecording) {
        return {
          success: false,
          error: 'Recording is already in progress',
        };
      }

      if (this.isWeb()) {
        const constraints = {
          audio: true,
          video: {
            facingMode:
              this.currentCamera === VideoRecorderCamera.FRONT
                ? 'user'
                : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        try {
          this.mediaStream =
            await navigator.mediaDevices.getUserMedia(constraints);
        } catch (mediaError) {
          let errorMessage = 'Failed to access camera and microphone';

          if (mediaError instanceof Error) {
            if (
              mediaError.name === 'NotAllowedError' ||
              mediaError.name === 'PermissionDeniedError'
            ) {
              errorMessage = 'Camera and microphone permissions are required';
            } else if (mediaError.name === 'NotFoundError') {
              errorMessage = 'No camera or microphone found on this device';
            } else if (mediaError.name === 'NotReadableError') {
              errorMessage =
                'Camera or microphone is already in use by another application';
            } else if (mediaError.name === 'OverconstrainedError') {
              errorMessage = 'Camera does not support the requested settings';
            }
          }

          return {
            success: false,
            error: errorMessage,
          };
        }

        const mimeType = MediaRecorder.isTypeSupported(
          'video/webm;codecs=vp9,opus',
        )
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                ? 'video/webm;codecs=vp8'
                : MediaRecorder.isTypeSupported('video/mp4')
                  ? 'video/mp4'
                  : 'video/webm';

        this.mediaRecorder = new MediaRecorder(this.mediaStream, {
          mimeType,
        });
        this.chunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
        };

        this.mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
        };

        this.mediaRecorder.start(1000);
        this.isRecording = true;
        this.recordingStartTime = Date.now();

        return {
          success: true,
          stream: this.mediaStream,
        };
      } else {
        await VideoRecorder.startRecording();
        this.isRecording = true;
        this.recordingStartTime = Date.now();

        return {
          success: true,
        };
      }
    } catch (error) {
      console.error('Error starting video recording:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to start recording',
      };
    }
  }

  async stopRecording(): Promise<VideoRecordingServiceResult> {
    try {
      if (!this.isRecording) {
        return {
          success: false,
          error: 'No recording in progress',
        };
      }

      let file: File | undefined;
      let videoUrl: string | undefined;
      const duration = this.recordingStartTime
        ? Math.floor((Date.now() - this.recordingStartTime) / 1000)
        : 0;

      if (this.isWeb()) {
        if (this.mediaRecorder && this.mediaStream) {
          this.mediaRecorder.stop();

          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((track) => track.stop());
          }

          const mimeType = this.mediaRecorder.mimeType || 'video/webm';
          const blob = new Blob(this.chunks, { type: mimeType });
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = mimeType.includes('webm') ? 'webm' : 'mp4';
          file = new File([blob], `video-recording-${timestamp}.${extension}`, {
            type: mimeType,
          });
          videoUrl = URL.createObjectURL(blob);

          this.chunks = [];
          this.mediaRecorder = null;
          this.mediaStream = null;
        }
      } else {
        const result = await VideoRecorder.stopRecording();

        if (result?.videoUrl) {
          videoUrl = result.videoUrl;

          const fileData = await Filesystem.readFile({
            directory: Directory.Cache,
            path: result.videoUrl,
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
              blob = new Blob([byteArray], { type: 'video/mp4' });
            } else if (fileData.data instanceof Blob) {
              blob = fileData.data;
            } else {
              throw new Error('Unsupported data format');
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            file = new File([blob], `video-recording-${timestamp}.mp4`, {
              type: 'video/mp4',
            });
          }
        }
      }

      this.isRecording = false;

      if (file) {
        return {
          success: true,
          file,
          duration,
          videoUrl,
        };
      }

      return {
        success: false,
        error: 'Failed to retrieve recording',
      };
    } catch (error) {
      console.error('Error stopping video recording:', error);

      this.isRecording = false;

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to stop recording',
      };
    }
  }

  async flipCamera(): Promise<VideoRecordingServiceResult> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Camera is not initialized',
        };
      }

      this.currentCamera =
        this.currentCamera === VideoRecorderCamera.FRONT
          ? VideoRecorderCamera.BACK
          : VideoRecorderCamera.FRONT;

      if (this.isWeb()) {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          audio: true,
          video: {
            facingMode:
              this.currentCamera === VideoRecorderCamera.FRONT
                ? 'user'
                : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        this.mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);

        const mimeType = MediaRecorder.isTypeSupported(
          'video/webm;codecs=vp9,opus',
        )
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
            ? 'video/webm;codecs=vp8,opus'
            : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9'
              : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
                ? 'video/webm;codecs=vp8'
                : MediaRecorder.isTypeSupported('video/mp4')
                  ? 'video/mp4'
                  : 'video/webm';

        this.mediaRecorder = new MediaRecorder(this.mediaStream, {
          mimeType,
        });
        this.chunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          console.log('MediaRecorder stopped');
        };

        if (this.isRecording) {
          this.mediaRecorder.start(1000);
        }

        return {
          success: true,
          stream: this.mediaStream,
        };
      } else {
        await VideoRecorder.flipCamera();

        return {
          success: true,
        };
      }
    } catch (error) {
      console.error('Error flipping camera:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to switch camera',
      };
    }
  }

  async getCurrentCamera(): Promise<VideoRecorderCamera> {
    return this.currentCamera;
  }

  async getDuration(): Promise<VideoRecordingServiceResult> {
    try {
      const result = await VideoRecorder.getDuration();

      return {
        success: true,
        duration: result?.value || 0,
      };
    } catch (error) {
      console.error('Error getting video duration:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get duration',
      };
    }
  }

  async destroy(): Promise<VideoRecordingServiceResult> {
    try {
      if (this.isWeb()) {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => {
            track.stop();
          });
        }
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          try {
            this.mediaRecorder.stop();
          } catch (e) {
            console.warn('Error stopping MediaRecorder:', e);
          }
        }

        this.mediaStream = null;
        this.mediaRecorder = null;
        this.chunks = [];
      } else {
        await VideoRecorder.destroy();
      }

      this.isInitialized = false;
      this.isRecording = false;
      this.recordingStartTime = 0;

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error destroying camera:', error);

      this.isInitialized = false;
      this.isRecording = false;

      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to destroy camera',
      };
    }
  }

  getRecordingDuration(): number {
    if (!this.isRecording || this.recordingStartTime === 0) {
      return 0;
    }

    const elapsed = Date.now() - this.recordingStartTime;
    return Math.floor(elapsed / 1000);
  }

  isCurrentlyInitialized(): boolean {
    return this.isInitialized;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getStream(): MediaStream | null {
    return this.mediaStream;
  }
}

export const videoRecordingService = new VideoRecordingService();
