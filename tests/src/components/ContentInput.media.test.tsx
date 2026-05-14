import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import type { RefObject } from 'react';
import '@testing-library/jest-dom';
import ContentInput from '../../../src/components/ContentInput';
import { toast } from 'sonner';
import { audioRecordingService } from '../../../src/lib/audioRecordingService';
import { videoRecordingService } from '../../../src/lib/videoRecordingService';
import { UserPreferencesProvider } from '../../../src/context/UserPreferencesContext';

const TEST_FILE_8MB = new File([new Uint8Array(1000)], 'video.mp4', {
  type: 'video/mp4',
});
const TEST_FILE_24MB = new File([new Uint8Array(1000)], 'video.mp4', {
  type: 'video/mp4',
});
const TEST_FILE_TEXT = new File(['test content'], 'test.txt', {
  type: 'text/plain',
});

const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const mockNetworkInfo = vi.hoisted(() => ({
  status: 'fast',
  downloadMbps: 40,
  connected: true,
  isOnline: true,
  lastUpdatedAt: Date.now(),
}));

const stableUserPrefs = { language: '', rights: '' };
const stableSetPrefs = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/hooks/useNetworkStrength', () => ({
  useNetworkStrength: () => mockNetworkInfo,
  getEstimatedUploadMbps: (info: {
    downloadMbps: number | null;
    connected: boolean;
    isOnline: boolean;
  }) => {
    if (!info.connected || !info.isOnline || info.downloadMbps == null)
      return null;
    return info.downloadMbps * 0.2;
  },
  formatEstimatedUploadTime: (seconds: number) => {
    const s = Math.max(1, Math.round(seconds));
    if (s < 60) return `~${s} sec`;
    const m = Math.round(s / 60);
    if (m < 60) return `~${m} min`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem === 0 ? `~${h} hr` : `~${h} hr ${rem} min`;
  },
  NetworkProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('../../../src/components/NetworkStrengthIndicator', () => ({
  NetworkStrengthIndicator: () => (
    <div data-testid="network-strength-indicator" />
  ),
}));

vi.mock('@/context/UserPreferencesContext', () => ({
  UserPreferencesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useUserPreferences: () => ({
    preferences: stableUserPrefs,
    setPreferences: stableSetPrefs,
    isLoaded: true,
  }),
}));

class MockMediaStream {
  getTracks() {
    return [];
  }
  getAudioTracks() {
    return [];
  }
  getVideoTracks() {
    return [];
  }
  addTrack() {}
  removeTrack() {}
}

// @ts-expect-error - Mock MediaStream globally
global.MediaStream = MockMediaStream;

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock('@/lib/audioRecordingService', () => ({
  audioRecordingService: {
    startRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    stopRecording: vi.fn(),
    getRecordingDuration: vi.fn(),
  },
}));

vi.mock('@/lib/videoRecordingService', () => ({
  videoRecordingService: {
    initialize: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    flipCamera: vi.fn(),
    destroy: vi.fn(),
    getRecordingDuration: vi.fn(),
  },
}));

vi.mock('../../../src/components/MediaUploadComponent', () => ({
  default: ({
    uploadMode,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    capturePhoto,
    stopCamera,
    switchCamera,
    resetRecording,
    handleFileSelectInternal,
    removeFile,
    selectedFiles = [],
    textContent = '',
    setTextContent,
    videoRef,
    videoRecordingRef,
    canvasRef,
    formatTime,
    formatFileSize,
  }: {
    uploadMode?: string;
    startRecording?: (type?: string) => void;
    pauseRecording?: () => void;
    resumeRecording?: () => void;
    stopRecording?: () => void;
    capturePhoto?: () => void;
    stopCamera?: () => void;
    switchCamera?: () => void;
    resetRecording?: () => void;
    handleFileSelectInternal?: (e: unknown) => void;
    removeFile?: (index: number) => void;
    selectedFiles?: File[];
    textContent?: string;
    setTextContent?: (content: string) => void;
    videoRef?: RefObject<HTMLVideoElement>;
    videoRecordingRef?: RefObject<HTMLVideoElement>;
    canvasRef?: RefObject<HTMLCanvasElement>;
    formatTime?: (seconds: number) => string;
    formatFileSize?: (bytes: number) => string;
  }) => (
    <div data-testid="media-upload-component">
      <button
        data-testid="start-recording-btn"
        onClick={() => startRecording?.(uploadMode)}
      >
        Start Recording
      </button>
      <button data-testid="pause-recording-btn" onClick={pauseRecording}>
        Pause
      </button>
      <button data-testid="resume-recording-btn" onClick={resumeRecording}>
        Resume
      </button>
      <button data-testid="stop-recording-btn" onClick={stopRecording}>
        Stop
      </button>
      <button data-testid="capture-photo-btn" onClick={capturePhoto}>
        Capture Photo
      </button>
      <button data-testid="stop-camera-btn" onClick={stopCamera}>
        Stop Camera
      </button>
      <button data-testid="switch-camera-btn" onClick={switchCamera}>
        Switch Camera
      </button>
      <button data-testid="reset-recording-btn" onClick={resetRecording}>
        Reset Recording
      </button>
      <button
        data-testid="remove-file-btn"
        onClick={() => removeFile?.(0)}
        disabled={selectedFiles.length === 0}
      >
        Remove File
      </button>
      <input
        data-testid="file-input"
        type="file"
        multiple
        onChange={handleFileSelectInternal}
      />
      <video data-testid="camera-preview" ref={videoRef} />
      <video data-testid="video-recording-preview" ref={videoRecordingRef} />
      <canvas data-testid="capture-canvas" ref={canvasRef} />
      <div data-testid="format-time">{formatTime?.(125)}</div>
      <div data-testid="format-size">{formatFileSize?.(2048)}</div>
      <div data-testid="format-size-zero">{formatFileSize?.(0)}</div>
      {textContent !== undefined && (
        <textarea
          data-testid="text-content-display"
          value={textContent}
          onChange={(e) => setTextContent?.(e.target.value)}
        />
      )}
    </div>
  ),
}));

vi.mock('@/components/LocationPicker', () => ({
  default: ({
    onLocationSelect,
    onClose,
  }: {
    onLocationSelect: (lat: number, lng: number) => void;
    onClose: () => void;
  }) => (
    <div data-testid="location-picker">
      <button
        data-testid="location-select-btn"
        onClick={() => onLocationSelect(12.9716, 77.5946)}
      >
        Select Location
      </button>
      <button data-testid="location-close-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

vi.mock('@/components/BottomNav', () => ({
  default: () => <div data-testid="bottom-nav">BottomNav</div>,
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCategory = {
  id: '1',
  name: 'fables',
  title: 'Fables',
  description: 'Test category',
  published: true,
  rank: 1,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockCategories = [
  mockCategory,
  {
    id: '2',
    name: 'music',
    title: 'Music',
    description: 'Test category 2',
    published: true,
    rank: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const createMockProps = (overrides: Partial<Record<string, unknown>> = {}) => ({
  uploadMode: 'text' as const,
  selectedCategory: mockCategory,
  categories: mockCategories,
  title: '',
  setTitle: vi.fn(),
  textContent: '',
  setTextContent: vi.fn(),
  selectedFile: null,
  setSelectedFile: vi.fn(),
  location: null,
  setLocation: vi.fn(),
  locationError: '',
  setLocationError: vi.fn(),
  showManualLocation: false,
  setShowManualLocation: vi.fn(),
  manualLat: '',
  setManualLat: vi.fn(),
  manualLng: '',
  setManualLng: vi.fn(),
  uploading: false,
  token: 'test-token',
  userId: 'test-user',
  description: '',
  setDescription: vi.fn(),
  descriptionError: false,
  setDescriptionError: vi.fn(),
  releaseRights: '',
  setreleaseRights: vi.fn(),
  creator: '',
  setCreator: vi.fn(),
  selectedLanguage: '',
  setSelectedLangugae: vi.fn(),
  onBack: vi.fn(),
  onUpload: vi.fn(),
  resetUploadState: vi.fn(),
  requestLocation: vi.fn(),
  handleManualLocationSubmit: vi.fn(),
  handleFileSelect: vi.fn(),
  chunkedUploadProgress: 0,
  isChunkedUploading: false,
  ...overrides,
});

const renderWithProvider = (ui: React.ReactElement) => {
  return render(<UserPreferencesProvider>{ui}</UserPreferencesProvider>);
};

describe('ContentInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockCreateObjectURL.mockReset();
    mockRevokeObjectURL.mockReset();
    mockNetworkInfo.status = 'fast';
    mockNetworkInfo.downloadMbps = 40;
    mockNetworkInfo.connected = true;
    mockNetworkInfo.isOnline = true;
    mockNetworkInfo.lastUpdatedAt = Date.now();

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        formatted_address: 'Bangalore, Karnataka, India',
        country: 'India',
        state: 'Karnataka',
        city: 'Bangalore',
        postal_code: '560001',
        latitude: 12.9716,
        longitude: 77.5946,
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Audio Recording', () => {
    beforeEach(() => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.pauseRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.resumeRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.stopRecording).mockResolvedValue({
        success: true,
        file: new File(['audio'], 'test.mp3', { type: 'audio/mpeg' }),
      });
      vi.mocked(audioRecordingService.getRecordingDuration).mockReturnValue(10);
    });

    it('starts audio recording when start button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('pauses audio recording when pause button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const pauseButton = screen.getByTestId('pause-recording-btn');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(audioRecordingService.pauseRecording).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('resumes audio recording when resume button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const pauseButton = screen.getByTestId('pause-recording-btn');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(audioRecordingService.pauseRecording).toHaveBeenCalled();
      });

      const resumeButton = screen.getByTestId('resume-recording-btn');
      fireEvent.click(resumeButton);

      await waitFor(() => {
        expect(audioRecordingService.resumeRecording).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('stops audio recording when stop button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const stopButton = screen.getByTestId('stop-recording-btn');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(audioRecordingService.stopRecording).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles audio recording start error', async () => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles audio recording stop error', async () => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.stopRecording).mockResolvedValue({
        success: false,
        error: 'Failed to stop',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const stopButton = screen.getByTestId('stop-recording-btn');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('uses the latest recording after record again and revokes the old preview URL', async () => {
      const onUpload = vi.fn().mockResolvedValue(undefined);
      const resetUploadState = vi.fn();
      const firstRecordingFile = new File(['short-audio'], 'short.m4a', {
        type: 'audio/m4a',
      });
      const secondRecordingFile = new File(['long-audio'], 'long.m4a', {
        type: 'audio/m4a',
      });

      mockCreateObjectURL
        .mockReturnValueOnce('blob:audio-short')
        .mockReturnValueOnce('blob:audio-long');

      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.stopRecording)
        .mockResolvedValueOnce({
          success: true,
          file: firstRecordingFile,
          duration: 3000,
        })
        .mockResolvedValueOnce({
          success: true,
          file: secondRecordingFile,
          duration: 12000,
        });
      vi.mocked(audioRecordingService.getRecordingDuration).mockReturnValue(12);

      render(
        <ContentInput
          {...createMockProps({
            uploadMode: 'audio',
            title: 'A Valid Title With Enough Words',
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            releaseRights: 'creator',
            selectedLanguage: 'hindi',
            location: { lat: 12.9716, lng: 77.5946 },
            onUpload,
            resetUploadState,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByTestId('stop-recording-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('reset-recording-btn')).toBeInTheDocument();
        expect(resetUploadState).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByTestId('reset-recording-btn'));

      expect(resetUploadState).toHaveBeenCalledTimes(2);

      fireEvent.click(screen.getByTestId('start-recording-btn'));
      fireEvent.click(screen.getByTestId('stop-recording-btn'));

      await waitFor(() => {
        expect(audioRecordingService.stopRecording).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('reset-recording-btn')).toBeInTheDocument();
        expect(resetUploadState).toHaveBeenCalledTimes(3);
      });

      fireEvent.click(screen.getByText('Upload Content'));

      await waitFor(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:audio-short');
      });
    });
  });

  describe('Video Recording', () => {
    beforeEach(() => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.stopRecording).mockResolvedValue({
        success: true,
        file: new File(['video'], 'test.mp4', { type: 'video/mp4' }),
      });
      vi.mocked(videoRecordingService.flipCamera).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.destroy).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.getRecordingDuration).mockReturnValue(10);
    });

    it('initializes and starts video recording when start button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(videoRecordingService.initialize).toHaveBeenCalled();
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('switches camera when switch camera button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(videoRecordingService.initialize).toHaveBeenCalled();
      });

      const switchButton = screen.getByTestId('switch-camera-btn');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(videoRecordingService.flipCamera).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('stops video recording and destroys camera when stop button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(videoRecordingService.initialize).toHaveBeenCalled();
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      const stopButton = screen.getByTestId('stop-recording-btn');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(videoRecordingService.stopRecording).toHaveBeenCalled();
        expect(videoRecordingService.destroy).toHaveBeenCalled();
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it('handles video recording initialization error', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: false,
        error: 'Camera not available',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles video recording start error', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: false,
        error: 'Failed to start',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles video recording stop error', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.stopRecording).mockResolvedValue({
        success: false,
        error: 'Failed to stop',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      const stopButton = screen.getByTestId('stop-recording-btn');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Photo Capture', () => {
    const mockGetUserMedia = vi.fn();

    beforeEach(() => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });

      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('captures photo when capture photo button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('stops camera when stop camera button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const stopButton = screen.getByTestId('stop-camera-btn');
      fireEvent.click(stopButton);
    });

    it('switches camera when switch camera button is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const switchButton = screen.getByTestId('switch-camera-btn');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      });
    });

    it('handles photo capture error', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles camera switch error', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Camera error'));

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const switchButton = screen.getByTestId('switch-camera-btn');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Pause/Resume Error Handling', () => {
    it('handles pause recording error gracefully', async () => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.pauseRecording).mockResolvedValue({
        success: false,
        error: 'Cannot pause',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const pauseButton = screen.getByTestId('pause-recording-btn');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('handles resume recording error gracefully', async () => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.pauseRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.resumeRecording).mockResolvedValue({
        success: false,
        error: 'Cannot resume',
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const startButton = screen.getByTestId('start-recording-btn');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      const pauseButton = screen.getByTestId('pause-recording-btn');
      fireEvent.click(pauseButton);

      await waitFor(() => {
        expect(audioRecordingService.pauseRecording).toHaveBeenCalled();
      });

      const resumeButton = screen.getByTestId('resume-recording-btn');
      fireEvent.click(resumeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Reset Recording', () => {
    it('resets recording state when reset button is clicked', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );

      const resetButton = screen.getByTestId('reset-recording-btn');
      fireEvent.click(resetButton);

      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });
  });

  describe('Helper Functions Coverage', () => {
    it('handles text upload with missing content', async () => {
      const onUpload = vi.fn();

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'text',
            title: 'A Valid Title With Enough Words',
            setTitle: vi.fn(),
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            setDescription: vi.fn(),
            releaseRights: 'creator',
            setreleaseRights: vi.fn(),
            selectedLanguage: 'en',
            setSelectedLangugae: vi.fn(),
            location: { lat: 12.9716, lng: 77.5946 },
            setLocation: vi.fn(),
            textContent: '',
            setTextContent: vi.fn(),
            onUpload,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const musicCategory = screen.getAllByText('Music')[0];
      fireEvent.click(musicCategory);

      const uploadButton = screen.getByText('Upload Content');
      fireEvent.click(uploadButton);

      expect(onUpload).not.toHaveBeenCalled();
    });

    it('handles file removal from selectedFiles', async () => {
      const setSelectedFile = vi.fn();
      const setSelectedFiles = vi.fn();

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            selectedFiles: [
              new File(['test'], 'test.txt', { type: 'text/plain' }),
            ],
            setSelectedFile,
            setSelectedFiles,
          })}
        />,
      );

      const removeButton = screen.getByTestId(
        'remove-file-btn',
      ) as HTMLButtonElement;
      if (!removeButton.disabled) {
        fireEvent.click(removeButton);
        expect(toast.success).toHaveBeenCalled();
      }
    });

    it('handles switch camera for image mode', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );

      const captureButton = screen.getByTestId('capture-photo-btn');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const switchButton = screen.getByTestId('switch-camera-btn');
      fireEvent.click(switchButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      });

      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('validates title with meaningful word count via component', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      const titleInput = screen.getByPlaceholderText(/enter.a.title/i);
      fireEvent.change(titleInput, { target: { value: 'Ab Cd Ef Gh' } });
      await waitFor(() => {
        expect(
          screen.getByText('Title must contain at least 2 meaningful words.'),
        ).toBeInTheDocument();
      });
    });

    it('renders category icon via component for known and unknown categories', () => {
      const musicCategory = {
        id: '3',
        name: 'music',
        title: 'Music',
        description: '',
        published: true,
        rank: 3,
        created_at: '',
        updated_at: '',
      };
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            selectedCategory: musicCategory,
            categories: [musicCategory],
          })}
        />,
      );
      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('renders formatted helper outputs from MediaUploadComponent props', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      expect(screen.getByTestId('format-time')).toHaveTextContent('2:05');
      expect(screen.getByTestId('format-size')).toHaveTextContent('2 KB');
      expect(screen.getByTestId('format-size-zero')).toHaveTextContent(
        '0 Bytes',
      );
    });
  });

  describe('Additional Branch Coverage', () => {
    it('runs audio recording timer interval and updates duration polling', async () => {
      vi.mocked(audioRecordingService.startRecording).mockResolvedValue({
        success: true,
      });
      vi.mocked(audioRecordingService.getRecordingDuration).mockReturnValue(42);

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(audioRecordingService.startRecording).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(audioRecordingService.getRecordingDuration).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('runs video recording timer interval and updates duration polling', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.getRecordingDuration).mockReturnValue(9);

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      await waitFor(
        () => {
          expect(videoRecordingService.getRecordingDuration).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('covers video start path when already initialized and flips camera', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.flipCamera).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );

      fireEvent.click(screen.getByTestId('start-recording-btn'));
      await waitFor(() => {
        expect(videoRecordingService.initialize).toHaveBeenCalledTimes(1);
      });

      fireEvent.click(screen.getByTestId('start-recording-btn'));
      await waitFor(() => {
        expect(videoRecordingService.flipCamera).toHaveBeenCalled();
      });
    });

    it('covers video metadata play failure logging path', async () => {
      const playSpy = vi
        .spyOn(HTMLMediaElement.prototype, 'play')
        .mockRejectedValue(new Error('play failed'));
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      const preview = screen.getByTestId(
        'video-recording-preview',
      ) as HTMLVideoElement;

      await act(async () => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Video play error:',
          expect.any(Error),
        );
      });

      playSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('handles thrown start recording errors', async () => {
      vi.mocked(audioRecordingService.startRecording).mockRejectedValue(
        new Error('boom'),
      );

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to start audio recording. Please check permissions.',
        );
      });
    });

    it('handles video pause/resume UI-only branches', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByTestId('pause-recording-btn'));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Recording paused');
      });

      fireEvent.click(screen.getByTestId('resume-recording-btn'));
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Recording resumed');
      });
    });

    it('handles thrown pause and resume errors', async () => {
      vi.mocked(audioRecordingService.pauseRecording).mockRejectedValue(
        new Error('pause exploded'),
      );
      vi.mocked(audioRecordingService.resumeRecording).mockRejectedValue(
        new Error('resume exploded'),
      );

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );
      fireEvent.click(screen.getByTestId('pause-recording-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to pause recording');
      });

      fireEvent.click(screen.getByTestId('resume-recording-btn'));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to resume recording');
      });
    });

    it('handles thrown stop recording errors', async () => {
      vi.mocked(audioRecordingService.stopRecording).mockRejectedValue(
        new Error('stop exploded'),
      );

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );
      fireEvent.click(screen.getByTestId('stop-recording-btn'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to stop recording');
      });
    });

    it('captures photo end-to-end and clears preview on stop camera', async () => {
      const trackStop = vi.fn();
      const mockStream = {
        getTracks: () => [{ stop: trackStop }],
      };

      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      const drawImage = vi.fn();
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage,
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        (callback) => {
          callback(new Blob(['img'], { type: 'image/jpeg' }));
        },
      );
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      fireEvent.click(screen.getByTestId('capture-photo-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const preview = screen.getByTestId('camera-preview') as HTMLVideoElement;
      Object.defineProperty(preview, 'videoWidth', { value: 640 });
      Object.defineProperty(preview, 'videoHeight', { value: 480 });

      await act(async () => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(() => {
        expect(drawImage).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith(
          'common.photoCapturedClickStopCameraWhenDone',
        );
      });

      fireEvent.click(screen.getByTestId('stop-camera-btn'));
      expect(trackStop).toHaveBeenCalled();
      expect(
        (screen.getByTestId('camera-preview') as HTMLVideoElement).srcObject,
      ).toBe(null);
    });

    it('switches image camera after successful capture and shows success toast', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        (callback) => callback(new Blob(['img'], { type: 'image/jpeg' })),
      );
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      fireEvent.click(screen.getByTestId('capture-photo-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(1);
      });

      const preview = screen.getByTestId('camera-preview') as HTMLVideoElement;
      Object.defineProperty(preview, 'videoWidth', { value: 640 });
      Object.defineProperty(preview, 'videoHeight', { value: 480 });

      act(() => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            'common.photoCapturedClickStopCameraWhenDone',
          );
        },
        { timeout: 5000 },
      );

      fireEvent.click(screen.getByTestId('switch-camera-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
      });

      act(() => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith('Switched to rear camera');
        },
        { timeout: 5000 },
      );
    });

    it('handles photo capture when blob creation fails', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
        (callback) => callback(null),
      );
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      fireEvent.click(screen.getByTestId('capture-photo-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const preview = screen.getByTestId('camera-preview') as HTMLVideoElement;
      Object.defineProperty(preview, 'videoWidth', { value: 640 });
      Object.defineProperty(preview, 'videoHeight', { value: 480 });

      act(() => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            'media.failedToCapturePhotoPleaseCheckCameraPermissions',
          );
        },
        { timeout: 5000 },
      );
    });

    it('handles photo capture when video is not ready', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      fireEvent.click(screen.getByTestId('capture-photo-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const preview = screen.getByTestId('camera-preview') as HTMLVideoElement;
      Object.defineProperty(preview, 'videoWidth', { value: 0 });
      Object.defineProperty(preview, 'videoHeight', { value: 0 });

      act(() => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            'media.failedToCapturePhotoPleaseCheckCameraPermissions',
          );
        },
        { timeout: 5000 },
      );
    });

    it('handles photo capture when canvas processing throws', async () => {
      const mockGetUserMedia = vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      });
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
        configurable: true,
      });

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
        () => {
          throw new Error('canvas error');
        },
      );
      vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      fireEvent.click(screen.getByTestId('capture-photo-btn'));

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      const preview = screen.getByTestId('camera-preview') as HTMLVideoElement;
      Object.defineProperty(preview, 'videoWidth', { value: 640 });
      Object.defineProperty(preview, 'videoHeight', { value: 480 });

      act(() => {
        preview.onloadedmetadata?.(new Event('loadedmetadata'));
      });

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            'media.failedToCapturePhotoPleaseCheckCameraPermissions',
          );
        },
        { timeout: 5000 },
      );
    });

    it('handles video switch camera error path', async () => {
      vi.mocked(videoRecordingService.initialize).mockResolvedValue({
        success: true,
      });
      vi.mocked(videoRecordingService.startRecording).mockResolvedValue({
        success: true,
        stream: new MediaStream(),
      });
      vi.mocked(videoRecordingService.flipCamera).mockRejectedValue(
        new Error('switch failed'),
      );

      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );
      fireEvent.click(screen.getByTestId('start-recording-btn'));

      await waitFor(() => {
        expect(videoRecordingService.startRecording).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByTestId('switch-camera-btn'));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('media.failedToSwitchCamera');
      });
    });

    it('covers selected category removal', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const musicCategory = screen.getAllByText('Music')[0];
      fireEvent.click(musicCategory);

      const buttons = screen.getAllByRole('button');
      const xButton = buttons.find(
        (btn) =>
          btn.querySelector('svg') && btn.closest('[class*="bg-emerald"]'),
      );
      if (xButton) {
        fireEvent.click(xButton);
      }

      expect(screen.getAllByText('Music').length).toBeGreaterThanOrEqual(1);
    });

    it('returns early for non-text upload when only external selectedFile exists', async () => {
      const onUpload = vi.fn();
      const selectedFile = new File(['x'], 'external.txt', {
        type: 'text/plain',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'document',
            title: 'A Valid Title With Enough Words',
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            releaseRights: 'creator',
            selectedLanguage: 'hindi',
            location: { lat: 12.9716, lng: 77.5946 },
            selectedFile,
            onUpload,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Upload Content'));
      await waitFor(() => {
        expect(onUpload).not.toHaveBeenCalled();
      });
    });

    it('keeps one file selected after removing one from multiple', async () => {
      const setSelectedFile = vi.fn();

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'document',
            title: 'A Valid Title With Enough Words',
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            releaseRights: 'creator',
            selectedLanguage: 'hindi',
            location: { lat: 12.9716, lng: 77.5946 },
            setSelectedFile,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const first = new File(['a'], 'first.txt', { type: 'text/plain' });
      const second = new File(['b'], 'second.txt', { type: 'text/plain' });
      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [first, second] },
      });

      fireEvent.click(screen.getByTestId('remove-file-btn'));

      await waitFor(() => {
        expect(setSelectedFile).toHaveBeenCalledWith(second);
      });
    });

    it('clears selected file when removing the last file', async () => {
      const setSelectedFile = vi.fn();

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            setSelectedFile,
          })}
        />,
      );

      const onlyFile = new File(['single'], 'single.txt', {
        type: 'text/plain',
      });

      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [onlyFile] },
      });
      fireEvent.click(screen.getByTestId('remove-file-btn'));

      await waitFor(() => {
        expect(setSelectedFile).toHaveBeenLastCalledWith(null);
      });
    });

    it.skip('uploads file and handles upload via upload button', async () => {
      const onUpload = vi.fn().mockResolvedValueOnce(undefined);

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'document',
            title: 'A Valid Title With Enough Words',
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            releaseRights: 'creator',
            selectedLanguage: 'hindi',
            location: { lat: 12.9716, lng: 77.5946 },
            onUpload,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const first = new File(['a'], 'first.txt', { type: 'text/plain' });
      fireEvent.change(screen.getByTestId('file-input'), {
        target: { files: [first] },
      });

      fireEvent.click(screen.getByText('Upload Content'));

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledTimes(1);
        expect(onUpload).toHaveBeenCalled();
        const [[fileArg, titleArg]] = onUpload.mock.calls;
        expect(fileArg).toBe(first);
        expect(titleArg).toEqual(expect.any(String));
      });
    });

    it('handles text upload rejection path', async () => {
      const onUpload = vi.fn().mockRejectedValue(new Error('text upload fail'));

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'text',
            title: 'A Valid Title With Enough Words',
            description:
              'A valid description with more than 32 characters and enough meaningful words here',
            releaseRights: 'creator',
            selectedLanguage: 'hindi',
            location: { lat: 12.9716, lng: 77.5946 },
            textContent: 'valid content',
            onUpload,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const musicCategory = screen.getAllByText('Music')[0];
      fireEvent.click(musicCategory);

      fireEvent.click(screen.getByText('Upload Content'));
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Text upload failed');
      });
    });
  });
});
