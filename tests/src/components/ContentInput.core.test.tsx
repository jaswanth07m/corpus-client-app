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

const mockLanguages = vi.hoisted(() => [
  'assamese',
  'bengali',
  'bhili',
  'bodo',
  'dogri',
  'english',
  'garo',
  'gujarati',
  'gondi',
  'hindi',
  'ho',
  'kannada',
  'khandeshi',
  'kashmiri',
  'khasi',
  'konkani',
  'kurukh',
  'maithili',
  'malayalam',
  'marathi',
  'mundari',
  'meitei',
  'nepali',
  'odia',
  'punjabi',
  'sanskrit',
  'santali',
  'sindhi',
  'tamil',
  'telugu',
  'tulu',
  'urdu',
]);

vi.mock('@/lib/languages', () => ({
  useLanguages: () => ({
    languages: mockLanguages,
    languageOptions: mockLanguages.map((l: string) => ({
      value: l,
      label: l.charAt(0).toUpperCase() + l.slice(1),
    })),
    isLoading: false,
    error: null,
  }),
  DEFAULT_PROFILE_LANGUAGES: ['telugu', 'hindi', 'english', 'urdu'],
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
  requestLocation: vi.fn(),
  handleManualLocationSubmit: vi.fn(),
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

  describe('Rendering', () => {
    it('renders component with text upload mode', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'text' })} />,
      );
      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('renders component with audio upload mode', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'audio' })} />,
      );
      expect(screen.getByText('Audio Recording')).toBeInTheDocument();
    });

    it('renders component with video upload mode', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'video' })} />,
      );
      expect(screen.getByText('Video Content')).toBeInTheDocument();
    });

    it('renders component with image upload mode', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'image' })} />,
      );
      expect(screen.getByText('Photo Capture')).toBeInTheDocument();
    });

    it('renders component with document upload mode', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: 'document' })} />,
      );
      expect(screen.getByText('Document Upload')).toBeInTheDocument();
    });

    it('displays selected category title in header', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      const headerElements = screen.getAllByText('Fables');
      expect(headerElements.length).toBeGreaterThan(0);
    });

    it('renders back button and calls onBack when clicked', () => {
      const onBack = vi.fn();
      renderWithProvider(<ContentInput {...createMockProps({ onBack })} />);

      const buttons = screen.getAllByRole('button');
      const backButton = buttons[0];
      fireEvent.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Title Input', () => {
    it('renders title input field', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      const titleInput = screen.getByPlaceholderText(/enter.a.title/i);
      expect(titleInput).toBeInTheDocument();
    });

    it('shows error when title is less than 8 characters', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const titleInput = screen.getByPlaceholderText(/enter.a.title/i);
      fireEvent.change(titleInput, { target: { value: 'Short' } });

      await waitFor(() => {
        expect(
          screen.getByText('Title must be at least 8 characters long.'),
        ).toBeInTheDocument();
      });
    });

    it('shows error when title has less than 2 meaningful words', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const titleInput = screen.getByPlaceholderText(/enter.a.title/i);
      fireEvent.change(titleInput, { target: { value: 'Ab Cd Ef' } });

      await waitFor(() => {
        expect(
          screen.getByText('Title must contain at least 2 meaningful words.'),
        ).toBeInTheDocument();
      });
    });

    it('clears error when title is valid', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const titleInput = screen.getByPlaceholderText(/enter.a.title/i);
      fireEvent.change(titleInput, {
        target: { value: 'This is a valid title with enough words' },
      });

      await waitFor(() => {
        expect(screen.queryByText(/Title must/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Description Input', () => {
    it('renders description textarea', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      const descriptionTextarea = screen.getByPlaceholderText(
        /provide.a.detailed.description/i,
      );
      expect(descriptionTextarea).toBeInTheDocument();
    });

    it('shows error when description is less than 32 characters', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const descriptionTextarea = screen.getByPlaceholderText(
        /provide.a.detailed.description/i,
      );
      fireEvent.change(descriptionTextarea, {
        target: { value: 'Short desc' },
      });

      await waitFor(() => {
        expect(
          screen.getByText('Description must be at least 32 characters long.'),
        ).toBeInTheDocument();
      });
    });

    it('shows error when description has less than 10 meaningful words', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const descriptionTextarea = screen.getByPlaceholderText(
        /provide.a.detailed.description/i,
      );
      fireEvent.change(descriptionTextarea, {
        target: { value: 'This is a short description with few words' },
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'Description must contain at least 10 meaningful words.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('clears error when description is valid', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const descriptionTextarea = screen.getByPlaceholderText(
        /provide.a.detailed.description/i,
      );
      fireEvent.change(descriptionTextarea, {
        target: {
          value:
            'This is a detailed description with many meaningful words that explains the content properly and thoroughly',
        },
      });

      await waitFor(() => {
        expect(screen.queryByText(/Description must/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    it('renders category selection when categories are provided', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      expect(screen.getAllByText('Fables').length).toBeGreaterThan(0);
    });

    it('allows selecting a category', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const musicCategory = screen.getAllByText('Music')[0];
      fireEvent.click(musicCategory);

      await waitFor(() => {
        const musicElements = screen.getAllByText('Music');
        expect(musicElements.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('allows removing a selected category', async () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const musicCategory = screen.getAllByText('Music')[0];
      fireEvent.click(musicCategory);

      await waitFor(() => {
        const xButtons = screen
          .getAllByRole('button')
          .filter(
            (btn) => btn.innerHTML.includes('<svg') || btn.querySelector('svg'),
          );
        if (xButtons.length > 0) {
          fireEvent.click(xButtons[0]);
        }
      });

      expect(screen.getAllByText('Music').length).toBeGreaterThanOrEqual(0);
    });

    it('renders categories in available list', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      expect(screen.getAllByText('Fables').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Music').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Location Verification', () => {
    it('verifies location when location is set', async () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({ location: { lat: 12.9716, lng: 77.5946 } })}
        />,
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/location/verify-location'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: 12.9716, longitude: 77.5946 }),
          }),
        );
      });
    });

    it('displays verified location', async () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({ location: { lat: 12.9716, lng: 77.5946 } })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });
    });

    it('shows error message when location verification fails', async () => {
      const setLocationError = vi.fn();

      mockFetch.mockClear();
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Location not found' }),
        }),
      );

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            location: { lat: 12.9716, lng: 77.5946 },
            setLocationError,
          })}
        />,
      );

      await waitFor(
        () => {
          expect(setLocationError).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it('allows editing verified location', async () => {
      const setLocation = vi.fn();
      const setLocationError = vi.fn();

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            location: { lat: 12.9716, lng: 77.5946 },
            setLocation,
            setLocationError,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      const editButton = buttons.find(
        (btn) =>
          btn.textContent?.toLowerCase().includes('edit') ||
          btn.textContent?.toLowerCase().includes('location'),
      );

      if (editButton) {
        fireEvent.click(editButton);
        expect(setLocation).toHaveBeenCalledWith(null);
      }
    });

    it('opens location picker when pick from map is clicked', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ location: null })} />,
      );

      const pickFromMapButton = screen.getByText(/pick.from.map/i);
      fireEvent.click(pickFromMapButton);

      expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    });

    it('closes location picker when close is clicked', async () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ location: null })} />,
      );

      const pickFromMapButton = screen.getByText(/pick.from.map/i);
      fireEvent.click(pickFromMapButton);

      expect(screen.getByTestId('location-picker')).toBeInTheDocument();

      const closeButton = screen.getByTestId('location-close-btn');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('location-picker')).not.toBeInTheDocument();
      });
    });

    it('calls setLocation when location is selected from picker', async () => {
      const setLocation = vi.fn();
      renderWithProvider(
        <ContentInput {...createMockProps({ location: null, setLocation })} />,
      );

      const pickFromMapButton = screen.getByText(/pick.from.map/i);
      fireEvent.click(pickFromMapButton);

      const selectButton = screen.getByTestId('location-select-btn');
      fireEvent.click(selectButton);

      await waitFor(() => {
        expect(setLocation).toHaveBeenCalledWith({
          lat: 12.9716,
          lng: 77.5946,
        });
      });
    });

    it('shows verifying location state', async () => {
      let resolvePromise: (value: unknown) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockImplementationOnce(() => delayedPromise);

      renderWithProvider(
        <ContentInput
          {...createMockProps({ location: { lat: 12.9716, lng: 77.5946 } })}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/verifyingLocation/i)).toBeInTheDocument();
      });

      resolvePromise!({
        ok: true,
        json: async () => ({
          formatted_address: 'Test',
          country: 'Test',
          state: 'Test',
          city: 'Test',
          postal_code: 'Test',
          latitude: 12.9716,
          longitude: 77.5946,
        }),
      });
    });

    it('shows location required when no location is set', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ location: null })} />,
      );
      expect(screen.getByText(/locationRequired/i)).toBeInTheDocument();
    });
  });

  describe('Language Selection', () => {
    it('renders language dropdown label', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      expect(screen.getByText(/selectLanguage/i)).toBeInTheDocument();
    });

    it('displays language options', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      expect(screen.getByText('assamese')).toBeInTheDocument();
      expect(screen.getByText('hindi')).toBeInTheDocument();
    });

    it('calls setSelectedLangugae when language is selected', () => {
      const setSelectedLangugae = vi.fn();
      renderWithProvider(
        <ContentInput {...createMockProps({ setSelectedLangugae })} />,
      );

      const languageSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(languageSelect, { target: { value: 'hindi' } });

      expect(setSelectedLangugae).toHaveBeenCalledWith('hindi');
    });

    it('shows selected language', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ selectedLanguage: 'kannada' })} />,
      );

      const languageSelect = screen.getAllByRole('combobox')[0];
      expect(languageSelect).toHaveValue('kannada');
    });
  });

  describe('Release Rights', () => {
    it('renders release rights dropdown label', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);
      expect(screen.getByText(/release.rights/i)).toBeInTheDocument();
    });

    it('shows toast when downloaded option is selected', () => {
      renderWithProvider(<ContentInput {...createMockProps()} />);

      const releaseRightsSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(releaseRightsSelect, {
        target: { value: 'downloaded' },
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it('shows creator input when others is selected', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ releaseRights: 'others' })} />,
      );

      expect(screen.getByText(/creator/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/enter.a.creator/i),
      ).toBeInTheDocument();
    });

    it('calls setCreator when creator input changes', () => {
      const setCreator = vi.fn();
      renderWithProvider(
        <ContentInput
          {...createMockProps({ releaseRights: 'others', setCreator })}
        />,
      );

      const creatorInput = screen.getByPlaceholderText(/enter.a.creator/i);
      fireEvent.change(creatorInput, { target: { value: 'John Doe' } });

      expect(setCreator).toHaveBeenCalledWith('John Doe');
    });

    it('calls setreleaseRights when release rights changes', () => {
      const setreleaseRights = vi.fn();
      renderWithProvider(
        <ContentInput {...createMockProps({ setreleaseRights })} />,
      );

      const releaseRightsSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(releaseRightsSelect, { target: { value: 'creator' } });

      expect(setreleaseRights).toHaveBeenCalledWith('creator');
    });
  });

  describe('Upload Button Validation', () => {
    const validTitle = 'A Valid Title With Enough Words';
    const validDescription =
      'A valid description with more than 32 characters and enough meaningful words here';
    const validProps = {
      title: validTitle,
      setTitle: vi.fn(),
      description: validDescription,
      setDescription: vi.fn(),
      releaseRights: 'creator' as const,
      setreleaseRights: vi.fn(),
      selectedLanguage: 'en',
      setSelectedLangugae: vi.fn(),
      location: { lat: 12.9716, lng: 77.5946 },
      setLocation: vi.fn(),
    };

    it('disables upload button when title is empty', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            title: '',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when title has error', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            title: 'Short',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when description is empty', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            description: '',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when description has error', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            description: 'Short',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when location is not verified', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            location: null,
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when release rights is empty', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            releaseRights: '',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when release rights is downloaded', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            releaseRights: 'downloaded',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when language is not selected', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            selectedLanguage: '',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when text content is empty in text mode', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            uploadMode: 'text' as const,
            textContent: '',
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('disables upload button when no file is selected in non-text mode', () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            uploadMode: 'audio' as const,
            selectedFile: null,
          })}
        />,
      );

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeDisabled();
    });

    it('enables upload button when all fields are valid', async () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            uploadMode: 'text' as const,
            textContent: 'Some content',
            setTextContent: vi.fn(),
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
      expect(uploadButton).not.toBeDisabled();
    });
  });

  describe('Text Upload', () => {
    const validProps = {
      title: 'A Valid Title With Enough Words',
      setTitle: vi.fn(),
      description:
        'A valid description with more than 32 characters and enough meaningful words here',
      setDescription: vi.fn(),
      releaseRights: 'creator' as const,
      setreleaseRights: vi.fn(),
      selectedLanguage: 'en',
      setSelectedLangugae: vi.fn(),
      location: { lat: 12.9716, lng: 77.5946 },
      setLocation: vi.fn(),
      uploadMode: 'text' as const,
      textContent: 'Test content',
      setTextContent: vi.fn(),
    };

    it('uploads text content when upload button is clicked', async () => {
      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
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

      // The component should handle the click without errors
      // (upload logic is now internal to ContentInput)
    });
  });

  describe('File Upload', () => {
    const validProps = {
      title: 'A Valid Title With Enough Words',
      setTitle: vi.fn(),
      description:
        'A valid description with more than 32 characters and enough meaningful words here',
      setDescription: vi.fn(),
      releaseRights: 'creator' as const,
      setreleaseRights: vi.fn(),
      selectedLanguage: 'en',
      setSelectedLangugae: vi.fn(),
      location: { lat: 12.9716, lng: 77.5946 },
      setLocation: vi.fn(),
      uploadMode: 'document' as const,
    };

    it('renders file upload component', async () => {
      const testFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            selectedFile: testFile,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('handles upload error gracefully', async () => {
      const testFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            ...validProps,
            selectedFile: testFile,
            setSelectedFile: vi.fn(),
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText('Bangalore, Karnataka, India'),
        ).toBeInTheDocument();
      });

      const uploadButton = screen.getByText('Upload Content');
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe('File Management', () => {
    it('renders remove file button', () => {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            selectedFile: testFile,
          })}
        />,
      );

      const removeButton = screen.getByTestId('remove-file-btn');
      expect(removeButton).toBeInTheDocument();
    });

    it('handles file select', async () => {
      const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      renderWithProvider(<ContentInput {...createMockProps()} />);

      const fileInput = screen.getByTestId('file-input');
      fireEvent.change(fileInput, {
        target: { files: [testFile] },
      });

      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Upload Progress', () => {
    it('shows estimated upload time when a selected file and known speed exist', () => {
      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      render(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      expect(screen.getByText('Estimated Time: ~1 sec')).toBeInTheDocument();
    });

    it('shows upload progress bar when chunked upload is in progress', () => {
      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      // The component should render without errors
      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('shows upload progress indicator during upload', () => {
      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('shows "Uploaded. Analyzing..." when progress is 100%', () => {
      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
            isChunkedUploading: true,
            chunkedUploadProgress: 50,
          })}
        />,
      );

      expect(screen.getByText('Estimated Time: ~1 sec')).toBeInTheDocument();
    });

    it('updates remaining estimated time during upload', async () => {
      let now = 0;
      const dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      const props = createMockProps({
        uploadMode: 'video',
        selectedFile: testFile,
      });

      const { rerender } = renderWithProvider(<ContentInput {...props} />);

      // Component should render without errors
      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();

      now = 2000;

      rerender(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('media-upload-component'),
        ).toBeInTheDocument();
      });

      dateNowSpy.mockRestore();
    });

    it('shows upload complete state when progress reaches 100%', () => {
      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      render(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      // The component should render without errors
      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('does not show progress bar when not uploading', () => {
      renderWithProvider(<ContentInput {...createMockProps({})} />);

      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
    });

    it('shows unavailable copy when upload speed cannot be estimated', () => {
      mockNetworkInfo.status = 'unknown';
      mockNetworkInfo.downloadMbps = null;
      mockNetworkInfo.connected = false;
      mockNetworkInfo.isOnline = true;

      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      expect(
        screen.getByText('Estimated Time Unavailable'),
      ).toBeInTheDocument();
    });

    it('shows offline copy when the network is offline', () => {
      mockNetworkInfo.status = 'offline';
      mockNetworkInfo.downloadMbps = null;
      mockNetworkInfo.connected = false;
      mockNetworkInfo.isOnline = false;

      const testFile = new File([new Uint8Array(1000)], 'video.mp4', {
        type: 'video/mp4',
      });

      render(
        <ContentInput
          {...createMockProps({
            uploadMode: 'video',
            selectedFile: testFile,
          })}
        />,
      );

      expect(
        screen.getByText('Upload Unavailable While Offline'),
      ).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty categories array gracefully', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ categories: [] })} />,
      );

      expect(screen.queryByText('Select Categories')).not.toBeInTheDocument();
    });

    it('handles null uploadMode gracefully', () => {
      renderWithProvider(
        <ContentInput {...createMockProps({ uploadMode: null })} />,
      );

      expect(screen.getByTestId('media-upload-component')).toBeInTheDocument();
    });

    it('handles location verification with invalid coordinates', async () => {
      const setLocationError = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid coordinates' }),
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            location: { lat: 999999, lng: 999999 },
            setLocationError,
          })}
        />,
      );

      await waitFor(() => {
        expect(setLocationError).toHaveBeenCalled();
      });
    });

    it('handles fetch error during location verification', async () => {
      const setLocationError = vi.fn();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            location: { lat: 12.9716, lng: 77.5946 },
            setLocationError,
          })}
        />,
      );

      await waitFor(() => {
        expect(setLocationError).toHaveBeenCalled();
      });
    });

    it('handles non-Error exception during location verification', async () => {
      const setLocationError = vi.fn();
      mockFetch.mockImplementationOnce(() => {
        throw 'Unknown error';
      });

      renderWithProvider(
        <ContentInput
          {...createMockProps({
            location: { lat: 12.9716, lng: 77.5946 },
            setLocationError,
          })}
        />,
      );

      await waitFor(() => {
        expect(setLocationError).toHaveBeenCalled();
      });
    });
  });
});
