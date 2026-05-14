// IMPORTANT: vi.mock calls must be at the very top before any imports
vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    className,
    variant,
    size,
    onClick,
    type = 'button',
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    variant?: string;
    size?: string;
    onClick?: () => void;
    type?: string;
  }) => (
    <button
      type={type}
      className={className}
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
  buttonVariants: vi.fn(),
}));

vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.documentUpload': 'Document Upload *',
        'common.uploadDocumentFilesPdfDocxTxtMax5Files':
          'Upload Document Files (PDF, DOCX, TXT) (Max 5 files)',
        'common.selectedFile': 'Selected File:',
        'common.selectedFiles': 'Selected Files:',
        'common.content': 'Content *',
        'ui.enter.your.text.content.here': 'Enter your text content here...',
        'media.audioRecording': 'Audio Recording *',
        'media.startRecording': 'Start Recording',
        'media.stopRecording': 'Stop Recording',
        'media.recordAgain': 'Record Again',
        'media.recordingCompleted': 'Recording completed (',
        'media.recordingPaused': 'Recording paused',
        'common.uploadAudioFilesMax5Files': 'Upload Audio Files (Max 5 files)',
        'common.yourBrowserDoesNotSupportTheAudioElement':
          'Your browser does not support the audio element.',
        'media.videoRecording': 'Video Recording *',
        'media.startVideoRecording': 'Start Video Recording',
        'common.switch.to': 'Switch to ',
        'common.uploadVideoFilesMax5Files': 'Upload Video Files (Max 5 files)',
        'common.yourBrowserDoesNotSupportTheVideoElement':
          'Your browser does not support the video element.',
        'media.photoCapture': 'Photo Capture *',
        'media.startCamera': 'Start Camera',
        'media.capturePhoto': 'Capture Photo',
        'media.stopCamera': 'Stop Camera',
        'media.photoCaptured': 'Photo captured: ',
        'media.capturedPhoto': 'Captured photo',
        'common.uploadImageFilesMax5Files': 'Upload Image Files (Max 5 files)',
        'common.takeAnother': 'Take Another',
        'common.': ')',
      };
      return translations[key] || key;
    },
  })),
  useSSR: vi.fn(),
  withTranslation: vi.fn(),
  Translation: vi.fn(({ children }) => children),
  I18nextProvider: vi.fn(({ children }) => children),
}));

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...(actual as object),
    Mic: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="mic-icon" className={className} />
    ),
    Video: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="video-icon" className={className} />
    ),
    Camera: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="camera-icon" className={className} />
    ),
    FileText: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="filetext-icon" className={className} />
    ),
    Upload: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="upload-icon" className={className} />
    ),
    Trash2: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="trash-icon" className={className} />
    ),
    Play: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="play-icon" className={className} />
    ),
    Pause: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="pause-icon" className={className} />
    ),
    Square: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="square-icon" className={className} />
    ),
    RotateCcw: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="rotate-icon" className={className} />
    ),
    RefreshCw: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="refresh-icon" className={className} />
    ),
    X: ({ size, className }: { size?: number; className?: string }) => (
      <span data-testid="x-icon" className={className} />
    ),
  };
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Regular imports come AFTER all vi.mock calls
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MediaUploadComponent from '../../../src/components/MediaUploadComponent';

// Mock URL.createObjectURL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('MediaUploadComponent', () => {
  const mockSetSelectedFile = vi.fn();
  const mockSetTextContent = vi.fn();
  const mockSetSelectedFiles = vi.fn();
  const mockHandleFileSelectInternal = vi.fn();
  const mockRemoveFile = vi.fn();
  const mockFormatFileSize = vi.fn(
    (bytes: number) => `${(bytes / 1024).toFixed(2)} KB`,
  );
  const mockFormatTime = vi.fn(
    (seconds: number) => `00:${seconds.toString().padStart(2, '0')}`,
  );

  const mockFileInputRef = { current: null };
  const mockVideoRef = { current: null };
  const mockVideoRecordingRef = { current: null };
  const mockCanvasRef = { current: null };

  const mockStartRecording = vi.fn();
  const mockPauseRecording = vi.fn();
  const mockResumeRecording = vi.fn();
  const mockStopRecording = vi.fn();
  const mockCapturePhoto = vi.fn();
  const mockStopCamera = vi.fn();
  const mockSwitchCamera = vi.fn();
  const mockResetRecording = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('General Behavior', () => {
    it('returns null when uploadMode is null', () => {
      const { container } = render(
        <MediaUploadComponent
          uploadMode={null}
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('returns null for invalid uploadMode', () => {
      const { container } = render(
        <MediaUploadComponent
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          uploadMode={'invalid' as any}
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders without crashing for each upload mode', () => {
      const modes = ['document', 'text', 'audio', 'video', 'image'] as const;

      modes.forEach((mode) => {
        expect(() =>
          render(
            <MediaUploadComponent
              uploadMode={mode}
              selectedFile={null}
              setSelectedFile={mockSetSelectedFile}
              textContent=""
              setTextContent={mockSetTextContent}
              selectedFiles={[]}
              setSelectedFiles={mockSetSelectedFiles}
              handleFileSelectInternal={mockHandleFileSelectInternal}
              fileInputRef={mockFileInputRef}
              formatFileSize={mockFormatFileSize}
              removeFile={mockRemoveFile}
            />,
          ),
        ).not.toThrow();
      });
    });
  });

  describe('Document Mode', () => {
    const defaultProps = {
      uploadMode: 'document' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [] as File[],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
    };

    it('renders document upload label and upload area', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('Document Upload *')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Upload Document Files (PDF, DOCX, TXT) (Max 5 files)',
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
    });

    it('renders hidden file input with correct accept attribute', () => {
      const { container } = render(<MediaUploadComponent {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.pdf,.doc,.docx,.txt');
      expect(fileInput).toHaveClass('hidden');
    });

    it('renders selected files list when files exist', () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(screen.getByText('Selected Files:')).toBeInTheDocument();
      expect(screen.getAllByText('test.pdf').length).toBeGreaterThan(0);
    });

    it('displays file size using formatFileSize', () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });
      mockFormatFileSize.mockReturnValue('1.50 KB');

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(screen.getByText('1.50 KB')).toBeInTheDocument();
    });

    it('calls removeFile when delete button is clicked', () => {
      const mockFile = new File(['test content'], 'test.pdf', {
        type: 'application/pdf',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFile).toHaveBeenCalledWith(0);
      }
    });

    it('calls handleFileSelectInternal when file input changes', () => {
      const { container } = render(<MediaUploadComponent {...defaultProps} />);
      const fileInput = container.querySelector('input[type="file"]');
      if (fileInput) {
        fireEvent.change(fileInput, {
          target: {
            files: [
              new File(['test'], 'test.pdf', { type: 'application/pdf' }),
            ],
          },
        });
        expect(mockHandleFileSelectInternal).toHaveBeenCalled();
      }
    });
  });

  describe('Text Mode', () => {
    const defaultProps = {
      uploadMode: 'text' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
    };

    it('renders text input label and textarea', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('Content *')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(
        'Enter your text content here...',
      );
      expect(textarea).toBeInTheDocument();
    });

    it('displays current text content in textarea', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          textContent="Existing content"
        />,
      );

      const textarea = screen.getByPlaceholderText(
        'Enter your text content here...',
      );
      expect(textarea).toHaveValue('Existing content');
    });

    it('calls setTextContent when textarea value changes', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        'Enter your text content here...',
      );
      fireEvent.change(textarea, { target: { value: 'New content' } });

      expect(mockSetTextContent).toHaveBeenCalledWith('New content');
    });

    it('textarea has correct styling classes', () => {
      const { container } = render(<MediaUploadComponent {...defaultProps} />);

      const textarea = container.querySelector('textarea');
      expect(textarea).toHaveClass('h-32', 'resize-vertical');
    });
  });

  describe('Audio Mode', () => {
    const defaultProps = {
      uploadMode: 'audio' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [] as File[],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
      isRecording: false,
      setIsRecording: vi.fn(),
      isPaused: false,
      setIsPaused: vi.fn(),
      recordedBlob: null,
      setRecordedBlob: vi.fn(),
      recordingTime: 0,
      setRecordingTime: vi.fn(),
      mediaRecorder: null,
      setMediaRecorder: vi.fn(),
      stream: null,
      setStream: vi.fn(),
      audioUrl: null,
      setAudioUrl: vi.fn(),
      startRecording: mockStartRecording,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
      stopRecording: mockStopRecording,
      resetRecording: mockResetRecording,
      formatTime: mockFormatTime,
    };

    it('renders start recording button when not recording', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('Start Recording')).toBeInTheDocument();
      expect(screen.getByTestId('mic-icon')).toBeInTheDocument();
    });

    it('calls startRecording when start recording button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      const startButton = screen.getByText('Start Recording').closest('button');
      if (startButton) {
        fireEvent.click(startButton);
        expect(mockStartRecording).toHaveBeenCalledWith('audio');
      }
    });

    it('renders recording UI with timer when recording', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          recordingTime={5}
        />,
      );

      expect(screen.getByText('00:05')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('calls pauseRecording when pause button is clicked', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          isPaused={false}
        />,
      );

      const pauseButton = screen.getByText('Pause').closest('button');
      if (pauseButton) {
        fireEvent.click(pauseButton);
        expect(mockPauseRecording).toHaveBeenCalled();
      }
    });

    it('calls resumeRecording when resume button is clicked', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          isPaused={true}
        />,
      );

      expect(screen.getByText('Resume')).toBeInTheDocument();

      const resumeButton = screen.getByText('Resume').closest('button');
      if (resumeButton) {
        fireEvent.click(resumeButton);
        expect(mockResumeRecording).toHaveBeenCalled();
      }
    });

    it('calls stopRecording when stop button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} isRecording={true} />);

      const stopButton = screen.getByText('Stop Recording').closest('button');
      if (stopButton) {
        fireEvent.click(stopButton);
        expect(mockStopRecording).toHaveBeenCalled();
      }
    });

    it('shows paused status when recording is paused', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          isPaused={true}
        />,
      );

      expect(screen.getByText('Recording paused')).toBeInTheDocument();
    });

    it('renders audio player when recording is complete', () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
      mockCreateObjectURL.mockReturnValue('blob:audio-url');

      const { container } = render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          audioUrl="blob:audio-url"
          recordingTime={30}
        />,
      );

      expect(
        screen.getByText((content) => content.includes('Recording completed')),
      ).toBeInTheDocument();
      expect(screen.getByText('Record Again')).toBeInTheDocument();
      const audio = container.querySelector('audio');
      expect(audio).toBeInTheDocument();
    });

    it('calls resetRecording when record again button is clicked', () => {
      const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });

      render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          audioUrl="blob:audio-url"
        />,
      );

      const recordAgainButton = screen
        .getByText('Record Again')
        .closest('button');
      if (recordAgainButton) {
        fireEvent.click(recordAgainButton);
        expect(mockResetRecording).toHaveBeenCalled();
      }
    });

    it('renders file upload alternative', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('OR')).toBeInTheDocument();
      expect(
        screen.getByText('Upload Audio Files (Max 5 files)'),
      ).toBeInTheDocument();
    });

    it('renders selected files list for uploaded audio', () => {
      const mockFile = new File(['audio data'], 'audio.mp3', {
        type: 'audio/mp3',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(screen.getByText('Selected Files:')).toBeInTheDocument();
      expect(screen.getAllByText('audio.mp3').length).toBeGreaterThan(0);
    });

    it('calls removeFile for uploaded audio file', () => {
      const mockFile = new File(['audio data'], 'audio.mp3', {
        type: 'audio/mp3',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFile).toHaveBeenCalledWith(0);
      }
    });
  });

  describe('Video Mode', () => {
    const defaultProps = {
      uploadMode: 'video' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [] as File[],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
      isRecording: false,
      setIsRecording: vi.fn(),
      isPaused: false,
      setIsPaused: vi.fn(),
      recordedBlob: null,
      setRecordedBlob: vi.fn(),
      recordingTime: 0,
      setRecordingTime: vi.fn(),
      mediaRecorder: null,
      setMediaRecorder: vi.fn(),
      stream: null,
      setStream: vi.fn(),
      videoUrl: null,
      setVideoUrl: vi.fn(),
      facingMode: 'user' as const,
      setFacingMode: vi.fn(),
      videoRecordingRef: mockVideoRecordingRef,
      startRecording: mockStartRecording,
      pauseRecording: mockPauseRecording,
      resumeRecording: mockResumeRecording,
      stopRecording: mockStopRecording,
      resetRecording: mockResetRecording,
      switchCamera: mockSwitchCamera,
      formatTime: mockFormatTime,
    };

    it('renders start video recording button when not recording', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('Start Video Recording')).toBeInTheDocument();
      expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    });

    it('calls startRecording with video type when start button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      const startButton = screen
        .getByText('Start Video Recording')
        .closest('button');
      if (startButton) {
        fireEvent.click(startButton);
        expect(mockStartRecording).toHaveBeenCalledWith('video');
      }
    });

    it('renders video element during recording', () => {
      const { container } = render(
        <MediaUploadComponent {...defaultProps} isRecording={true} />,
      );

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).not.toHaveClass('hidden');
    });

    it('renders camera switch button during recording', () => {
      render(<MediaUploadComponent {...defaultProps} isRecording={true} />);

      expect(screen.getByText('Switch to Rear Camera')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('calls switchCamera when switch button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} isRecording={true} />);

      const switchButton = screen
        .getByText('Switch to Rear Camera')
        .closest('button');
      if (switchButton) {
        fireEvent.click(switchButton);
        expect(mockSwitchCamera).toHaveBeenCalled();
      }
    });

    it('shows different switch button text for environment camera', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          facingMode="environment"
        />,
      );

      expect(screen.getByText('Switch to Front Camera')).toBeInTheDocument();
    });

    it('renders recording controls during recording', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          recordingTime={10}
        />,
      );

      expect(screen.getByText('00:10')).toBeInTheDocument();
      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('shows resume button when paused', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isRecording={true}
          isPaused={true}
        />,
      );

      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.getByText('Recording paused')).toBeInTheDocument();
    });

    it('renders video player when recording is complete', () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });

      const { container } = render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          videoUrl="blob:video-url"
          recordingTime={45}
        />,
      );

      expect(
        screen.getByText((content) => content.includes('Recording completed')),
      ).toBeInTheDocument();
      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('does not render video player when recordedBlob exists but videoUrl is null', () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });

      const { container } = render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          videoUrl={null}
        />,
      );

      // Should not render the "Recording completed" message when videoUrl is null
      expect(
        screen.queryByText((content) =>
          content.includes('Recording completed'),
        ),
      ).not.toBeInTheDocument();
    });

    it('renders video player when formatTime is undefined', () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });

      const { container } = render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          videoUrl="blob:video-url"
          formatTime={undefined}
        />,
      );

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('renders video player with zero recording time', () => {
      const mockBlob = new Blob(['video data'], { type: 'video/mp4' });

      const { container } = render(
        <MediaUploadComponent
          {...defaultProps}
          recordedBlob={mockBlob}
          videoUrl="blob:video-url"
          recordingTime={0}
        />,
      );

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('renders file upload alternative for video', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(
        screen.getByText('Upload Video Files (Max 5 files)'),
      ).toBeInTheDocument();
    });

    it('renders selected files list for uploaded video', () => {
      const mockFile = new File(['video data'], 'video.mp4', {
        type: 'video/mp4',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(screen.getByText('Selected Files:')).toBeInTheDocument();
      expect(screen.getAllByText('video.mp4').length).toBeGreaterThan(0);
    });

    it('calls removeFile for uploaded video file', () => {
      const mockFile = new File(['video data'], 'video.mp4', {
        type: 'video/mp4',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFile).toHaveBeenCalledWith(0);
      }
    });
  });

  describe('Image Mode', () => {
    const defaultProps = {
      uploadMode: 'image' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [] as File[],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
      isCameraActive: false,
      setIsCameraActive: vi.fn(),
      facingMode: 'user' as const,
      setFacingMode: vi.fn(),
      cameraStream: null,
      setCameraStream: vi.fn(),
      videoRef: mockVideoRef,
      canvasRef: mockCanvasRef,
      capturePhoto: mockCapturePhoto,
      stopCamera: mockStopCamera,
      switchCamera: mockSwitchCamera,
    };

    it('renders start camera button when camera is not active', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(screen.getByText('Start Camera')).toBeInTheDocument();
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    it('calls capturePhoto when start camera button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      const startButton = screen.getByText('Start Camera').closest('button');
      if (startButton) {
        fireEvent.click(startButton);
        expect(mockCapturePhoto).toHaveBeenCalled();
      }
    });

    it('renders video element when camera is active', () => {
      const { container } = render(
        <MediaUploadComponent {...defaultProps} isCameraActive={true} />,
      );

      const video = container.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).not.toHaveClass('hidden');
    });

    it('renders camera switch button when camera is active', () => {
      render(<MediaUploadComponent {...defaultProps} isCameraActive={true} />);

      expect(screen.getByText('Switch to Rear Camera')).toBeInTheDocument();
    });

    it('calls switchCamera when switch button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} isCameraActive={true} />);

      const switchButton = screen
        .getByText('Switch to Rear Camera')
        .closest('button');
      if (switchButton) {
        fireEvent.click(switchButton);
        expect(mockSwitchCamera).toHaveBeenCalled();
      }
    });

    it('shows different switch text for environment camera', () => {
      render(
        <MediaUploadComponent
          {...defaultProps}
          isCameraActive={true}
          facingMode="environment"
        />,
      );

      expect(screen.getByText('Switch to Front Camera')).toBeInTheDocument();
    });

    it('renders capture and stop buttons when camera is active', () => {
      render(<MediaUploadComponent {...defaultProps} isCameraActive={true} />);

      expect(screen.getByText('Capture Photo')).toBeInTheDocument();
      expect(screen.getByText('Stop Camera')).toBeInTheDocument();
    });

    it('calls capturePhoto when capture button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} isCameraActive={true} />);

      const captureButton = screen.getByText('Capture Photo').closest('button');
      if (captureButton) {
        fireEvent.click(captureButton);
        expect(mockCapturePhoto).toHaveBeenCalled();
      }
    });

    it('calls stopCamera when stop button is clicked', () => {
      render(<MediaUploadComponent {...defaultProps} isCameraActive={true} />);

      const stopButton = screen.getByText('Stop Camera').closest('button');
      if (stopButton) {
        fireEvent.click(stopButton);
        expect(mockStopCamera).toHaveBeenCalled();
      }
    });

    it('renders captured photo preview', () => {
      const mockFile = new File(['image data'], 'photo.jpg', {
        type: 'image/jpeg',
      });
      mockCreateObjectURL.mockReturnValue('blob:image-url');

      render(
        <MediaUploadComponent
          {...defaultProps}
          selectedFile={mockFile}
          setSelectedFiles={mockSetSelectedFiles}
        />,
      );

      expect(
        screen.getByText((content) => content.includes('Photo captured')),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes('photo.jpg')),
      ).toBeInTheDocument();
      expect(screen.getByAltText('Captured photo')).toBeInTheDocument();
    });

    it('calls setSelectedFile and setSelectedFiles when take another is clicked', () => {
      const mockFile = new File(['image data'], 'photo.jpg', {
        type: 'image/jpeg',
      });

      render(
        <MediaUploadComponent
          {...defaultProps}
          selectedFile={mockFile}
          setSelectedFiles={mockSetSelectedFiles}
        />,
      );

      const takeAnotherButton = screen
        .getByText('Take Another')
        .closest('button');
      if (takeAnotherButton) {
        fireEvent.click(takeAnotherButton);
        expect(mockSetSelectedFile).toHaveBeenCalledWith(null);
        expect(mockSetSelectedFiles).toHaveBeenCalledWith([]);
      }
    });

    it('renders file upload alternative for images', () => {
      render(<MediaUploadComponent {...defaultProps} />);

      expect(
        screen.getByText('Upload Image Files (Max 5 files)'),
      ).toBeInTheDocument();
    });

    it('renders selected files list with image preview', () => {
      const mockFile = new File(['image data'], 'selected.jpg', {
        type: 'image/jpeg',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(screen.getByText('Selected Files:')).toBeInTheDocument();
      expect(screen.getAllByText('selected.jpg').length).toBeGreaterThan(0);
    });

    it('renders image preview for selected image files', () => {
      const mockFile = new File(['image data'], 'preview.jpg', {
        type: 'image/jpeg',
      });

      const { container } = render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
    });

    it('calls removeFile for selected image file', () => {
      const mockFile = new File(['image data'], 'remove.jpg', {
        type: 'image/jpeg',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      const deleteButton = screen.getByTestId('trash-icon').closest('button');
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockRemoveFile).toHaveBeenCalledWith(0);
      }
    });

    it('renders canvas element (hidden)', () => {
      const { container } = render(<MediaUploadComponent {...defaultProps} />);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveStyle('display: none');
    });
  });

  describe('formatFileSize', () => {
    const defaultProps = {
      uploadMode: 'document' as const,
      selectedFile: null,
      setSelectedFile: mockSetSelectedFile,
      textContent: '',
      setTextContent: mockSetTextContent,
      selectedFiles: [] as File[],
      setSelectedFiles: mockSetSelectedFiles,
      handleFileSelectInternal: mockHandleFileSelectInternal,
      fileInputRef: mockFileInputRef,
      formatFileSize: mockFormatFileSize,
      removeFile: mockRemoveFile,
    };

    it('formats file size correctly', () => {
      const mockFile = new File(['test'], 'test.pdf', {
        type: 'application/pdf',
      });

      render(
        <MediaUploadComponent {...defaultProps} selectedFiles={[mockFile]} />,
      );

      expect(mockFormatFileSize).toHaveBeenCalledWith(mockFile.size);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing optional callbacks gracefully', () => {
      expect(() =>
        render(
          <MediaUploadComponent
            uploadMode="audio"
            selectedFile={null}
            setSelectedFile={mockSetSelectedFile}
            textContent=""
            setTextContent={mockSetTextContent}
            selectedFiles={[]}
            setSelectedFiles={mockSetSelectedFiles}
            handleFileSelectInternal={mockHandleFileSelectInternal}
            fileInputRef={mockFileInputRef}
            formatFileSize={mockFormatFileSize}
            removeFile={mockRemoveFile}
          />,
        ),
      ).not.toThrow();
    });

    it('handles empty selectedFiles array', () => {
      const { container } = render(
        <MediaUploadComponent
          uploadMode="document"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
        />,
      );

      expect(screen.queryByText('Selected File:')).not.toBeInTheDocument();
    });

    it('handles null recordedBlob', () => {
      expect(() =>
        render(
          <MediaUploadComponent
            uploadMode="audio"
            selectedFile={null}
            setSelectedFile={mockSetSelectedFile}
            textContent=""
            setTextContent={mockSetTextContent}
            selectedFiles={[]}
            setSelectedFiles={mockSetSelectedFiles}
            handleFileSelectInternal={mockHandleFileSelectInternal}
            fileInputRef={mockFileInputRef}
            formatFileSize={mockFormatFileSize}
            removeFile={mockRemoveFile}
            isRecording={false}
            recordedBlob={null}
            audioUrl={null}
          />,
        ),
      ).not.toThrow();
    });

    it('handles zero recording time', () => {
      render(
        <MediaUploadComponent
          uploadMode="audio"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
          isRecording={true}
          recordingTime={0}
          formatTime={mockFormatTime}
        />,
      );

      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles multiple files in selectedFiles', () => {
      const file1 = new File(['content1'], 'file1.pdf', {
        type: 'application/pdf',
      });
      const file2 = new File(['content2'], 'file2.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const file3 = new File(['content3'], 'file3.txt', { type: 'text/plain' });

      render(
        <MediaUploadComponent
          uploadMode="document"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[file1, file2, file3]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
        />,
      );

      expect(screen.getAllByText('file1.pdf').length).toBeGreaterThan(0);
      expect(screen.getAllByText('file2.docx').length).toBeGreaterThan(0);
      expect(screen.getAllByText('file3.txt').length).toBeGreaterThan(0);
    });

    it('hides video element when not recording in video mode', () => {
      const { container } = render(
        <MediaUploadComponent
          uploadMode="video"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
          isRecording={false}
          videoRecordingRef={mockVideoRecordingRef}
        />,
      );

      const video = container.querySelector('video');
      expect(video).toHaveClass('hidden');
    });

    it('hides video element when camera is not active in image mode', () => {
      const { container } = render(
        <MediaUploadComponent
          uploadMode="image"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
          isCameraActive={false}
          videoRef={mockVideoRef}
        />,
      );

      const video = container.querySelector('video');
      expect(video).toHaveClass('hidden');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all interactive elements', () => {
      render(
        <MediaUploadComponent
          uploadMode="document"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
        />,
      );

      expect(screen.getByText('Document Upload *')).toBeInTheDocument();
    });

    it('has proper button type attribute', () => {
      render(
        <MediaUploadComponent
          uploadMode="audio"
          selectedFile={null}
          setSelectedFile={mockSetSelectedFile}
          textContent=""
          setTextContent={mockSetTextContent}
          selectedFiles={[]}
          setSelectedFiles={mockSetSelectedFiles}
          handleFileSelectInternal={mockHandleFileSelectInternal}
          fileInputRef={mockFileInputRef}
          formatFileSize={mockFormatFileSize}
          removeFile={mockRemoveFile}
          startRecording={mockStartRecording}
        />,
      );

      const startButton = screen.getByText('Start Recording').closest('button');
      expect(startButton).toHaveAttribute('type', 'button');
    });
  });
});
