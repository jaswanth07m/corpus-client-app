// Pause Button Added In Audio/Video + Camera Switch Function + Progress

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BottomNav from './BottomNav';
import {
  ArrowLeft,
  MapPin,
  Pencil,
  Type,
  Mic,
  Video,
  Image,
  X,
  Check,
  AlertCircle,
  Camera,
  Square,
  Play,
  Pause,
  RotateCcw,
  RefreshCw,
  Upload,
  Trash2,
  FileText,
  X as XIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import LocationPicker from './LocationPicker';
import { BACKEND_URL } from '@/lib/constants';
import MediaUploadComponent from './MediaUploadComponent';
import { audioRecordingService } from '@/lib/audioRecordingService';
import { videoRecordingService } from '@/lib/videoRecordingService';
import { mapAudioErrors, validateAudioFile } from '@/lib/audio-validation';
import { useUserPreferences } from '@/context/UserPreferencesContext';
import { useUserPreferences } from '@/context/UserPreferencesContext';

interface Category {
  id: string;
  name: string;
  title: string;
  description: string;
  published: boolean;
  rank: number;
  created_at: string;
  updated_at: string;
}

// Per-file metadata interface
interface FileMetadata {
  title: string;
  description: string;
}

// Re-added the VerifiedLocation interface for the verification flow
interface VerifiedLocation {
  formatted_address: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

interface ContentInputProps {
  uploadMode: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  selectedCategory: Category | null;
  categories?: Category[];
  setSelectedCategory?: (category: Category | null) => void;
  selectedCategories?: Category[]; // For multi-selection
  setSelectedCategories?: (categories: Category[]) => void; // For multi-selection
  title: string;
  setTitle: (title: string) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  location: { lat: number; lng: number } | null;
  setLocation: (location: { lat: number; lng: number } | null) => void;
  locationError: string;
  setLocationError: (error: string) => void;
  showManualLocation: boolean;
  setShowManualLocation: (show: boolean) => void;
  manualLat: string;
  setManualLat: (lat: string) => void;
  manualLng: string;
  setManualLng: (lng: string) => void;
  uploading: boolean;
  token: string;
  userId: string;
  description: string;
  setDescription: (description: string) => void;
  descriptionError: boolean;
  setDescriptionError: (error: boolean) => void;
  releaseRights: string;
  setreleaseRights: (releaseRights: string) => void;
  creator: string;
  setCreator: (creator: string) => void;
  selectedLanguage: string;
  setSelectedLangugae: (selectedLanguage: string) => void;

  onBack: () => void;
  onUpload: (
    file: File,
    description: string,
    fileTitle?: string,
  ) => Promise<void>;

  requestLocation: () => void;
  handleManualLocationSubmit: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;

  chunkedUploadProgress: number;
  isChunkedUploading?: boolean;

  // New props for per-file metadata
  fileMetadata?: FileMetadata[];
  setFileMetadata?: (metadata: FileMetadata[]) => void;
}

const countMeaningfulWords = (s: string) => {
  return s.split(' ').filter((w) => w.length > 2).length;
};

const getCategoryIcon = (name: string) => {
  const iconMap: { [key: string]: string } = {
    fables: '📚',
    events: '🎉',
    music: '🎵',
    places: '🏛️',
    food: '🍽️',
    people: '👥',
    literature: '📖',
    architecture: '🏗️',
    skills: '⚡',
    images: '🖼️',
    culture: '🎭',
    'flora_&_fauna': '🌿',
    education: '🎓',
    vegetation: '🌱',
    folk_songs: '🎶',
    traditional_skills: '🛠️',
    local_cultural_history: '🏛️',
    local_history: '📜',
    food_agriculture: '🌾',
    old_newspapers: '📰',
    'folk tales': '📓',
  };
  return iconMap[name] || '📂';
};

const ContentInput: React.FC<Partial<ContentInputProps>> = ({
  uploadMode,
  selectedCategory,
  categories = [],
  setSelectedCategory,
  selectedCategories = [],
  setSelectedCategories,
  title,
  setTitle,
  textContent,
  setTextContent,
  selectedFile,
  setSelectedFile,
  description,
  setDescription,
  location,
  setLocation,
  locationError,
  setLocationError,
  showManualLocation,
  setShowManualLocation,
  manualLat,
  setManualLat,
  manualLng,
  setManualLng,
  uploading,

  releaseRights,
  setreleaseRights,
  creator,
  setCreator,
  selectedLanguage,
  setSelectedLangugae,

  onBack,
  onUpload,
  requestLocation,
  handleManualLocationSubmit,
  handleFileSelect,
  // Phase 4: Chunked upload progress props
  chunkedUploadProgress = 0,
  isChunkedUploading = false,
}) => {
  const { t } = useTranslation();
  const { preferences } = useUserPreferences();
  const { preferences } = useUserPreferences();
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoInitialized, setIsVideoInitialized] = useState(false);

  // For compatibility with MediaUploadComponent props
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Multiple file upload states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Per-file title and description state
  const [fileMetadata, setFileMetadata] = useState<FileMetadata[]>([]);

  // Multi-category selection state - fallback to empty array if not provided
  const [multiSelectedCategories, setMultiSelectedCategories] = useState<
    Category[]
  >(selectedCategories || []);

  // Title and Description validation
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // Location Picker Modal State
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const hasVerifiedLocation = useRef<string>('');

  // Location Verification State
  const [verifiedLocation, setVerifiedLocation] =
    useState<VerifiedLocation | null>(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  // Verification Logic
  const verifyLocation = useCallback(
    async (lat: number, lng: number) => {
      if (!lat || !lng) return;
      setIsVerifyingLocation(true);
      setVerifiedLocation(null); // Clear previous verified location
      if (setLocationError) setLocationError('');

      try {
        const apiUrl = BACKEND_URL + '/location/verify-location';
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latitude: lat, longitude: lng }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            message: 'Failed to verify location',
          }));
          throw new Error(errorData.message || 'Failed to verify location');
        }
        const data: VerifiedLocation = await response.json();
        setVerifiedLocation(data);
      } catch (error: unknown) {
        console.error('Location verification error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to verify location.';
        toast.error(errorMessage);
        if (setLocationError)
          setLocationError(
            'Could not verify location. Please try a different spot.',
          );
      } finally {
        setIsVerifyingLocation(false);
      }
    },
    [setLocationError],
  );

  useEffect(() => {
    if (location && !isVerifyingLocation) {
      verifyLocation(location.lat, location.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleLocationSelect = (lat: number, lng: number) => {
    if (setLocation) {
      setLocation({ lat, lng });
    }
    setShowLocationPicker(false);
  };

  const handleEditLocation = () => {
    setVerifiedLocation(null);
    if (setLocation) setLocation(null);
    if (setLocationError) setLocationError('');
    if (setShowManualLocation) setShowManualLocation(false);
    setShowLocationPicker(true);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const videoRecordingRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOptions = [
    {
      type: 'text' as const,
      icon: <Type className="w-6 h-6" />,
      title: 'Text Input',
      description: 'Type your content',
      accept: '',
    },
    {
      type: 'audio' as const,
      icon: <Mic className="w-6 h-6" />,
      title: 'Audio Recording',
      description: 'Record your voice',
      accept: 'audio/*',
    },
    {
      type: 'video' as const,
      icon: <Video className="w-6 h-6" />,
      title: 'Video Content',
      description: 'Record or upload video',
      accept: 'video/*',
    },
    {
      type: 'image' as const,
      icon: <Image className="w-6 h-6" />,
      title: 'Photo Capture',
      description: 'Take or upload photos',
      accept: 'image/*',
    },
    {
      type: 'document' as const,
      icon: <FileText className="w-6 h-6" />,
      title: 'Document Upload',
      description: 'Upload document files (PDF, DOCX, etc.)',
      accept: '.pdf,.doc,.docx,.txt',
    },
  ];

  const languages = [
    'assamese',
    'bengali',
    'bodo',
    'dogri',
    'gujarati',
    'hindi',
    'kannada',
    'kashmiri',
    'konkani',
    'maithili',
    'malayalam',
    'marathi',
    'meitei',
    'nepali',
    'odia',
    'punjabi',
    'sanskrit',
    'santali',
    'sindhi',
    'tamil',
    'telugu',
    'urdu',
  ];

  useEffect(() => {
    if (isRecording && !isPaused) {
      recordingInterval.current = setInterval(() => {
        if (uploadMode === 'audio') {
          setRecordingTime(audioRecordingService.getRecordingDuration());
        } else if (uploadMode === 'video') {
          setRecordingTime(videoRecordingService.getRecordingDuration());
        }
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    }
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording, isPaused, uploadMode]);

  const switchCamera = async () => {
    try {
      if (uploadMode === 'video' && isVideoInitialized) {
        const result = await videoRecordingService.flipCamera();
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);

        if (result.stream && videoRecordingRef.current) {
          videoRecordingRef.current.srcObject = result.stream;
          videoRecordingRef.current.muted = true;
          videoRecordingRef.current.playsInline = true;
        }

        toast.success(
          `Switched to ${newFacingMode === 'user' ? 'front' : 'rear'} camera`,
        );
      } else if (uploadMode === 'image' && isCameraActive) {
        const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newFacingMode);

        // Stop current stream
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }

        // Restart photo capture with new camera
        await capturePhoto(newFacingMode);
        toast.success(
          `Switched to ${newFacingMode === 'user' ? 'front' : 'rear'} camera`,
        );
      }
    } catch (error) {
      console.error('Camera switch error:', error);
      toast.error(t('media.failedToSwitchCamera'));
    }
  };

  const startRecording = async (
    type: 'audio' | 'video',
    customFacingMode?: 'user' | 'environment',
  ) => {
    try {
      if (type === 'audio') {
        const result = await audioRecordingService.startRecording();

        if (result.success) {
          setIsRecording(true);
          setIsPaused(false);
          setRecordingTime(0);
          toast.success(t('media.audioRecordingStarted'));
        } else {
          toast.error(result.error || 'Failed to start audio recording');
        }
      } else if (type === 'video') {
        const currentFacingMode = customFacingMode || facingMode;
        const cameraType =
          currentFacingMode === 'user'
            ? 0 // FRONT
            : 1; // BACK

        if (!isVideoInitialized) {
          const initResult = await videoRecordingService.initialize({
            camera: cameraType,
          });

          if (!initResult.success) {
            toast.error(initResult.error || 'Failed to initialize camera');
            return;
          }

          setIsVideoInitialized(true);
        } else {
          // Switch camera if needed
          await videoRecordingService.flipCamera();
        }

        const result = await videoRecordingService.startRecording();

        if (result.success) {
          setIsRecording(true);
          setIsPaused(false);
          setRecordingTime(0);

          if (result.stream && videoRecordingRef.current) {
            videoRecordingRef.current.srcObject = result.stream;
            videoRecordingRef.current.muted = true;
            videoRecordingRef.current.playsInline = true;
            videoRecordingRef.current.onloadedmetadata = () => {
              videoRecordingRef.current?.play().catch((error) => {
                console.error('Video play error:', error);
              });
            };
          }

          toast.success(t('media.videoRecordingStarted'));
        } else {
          toast.error(result.error || 'Failed to start video recording');
        }
      }
    } catch (error) {
      console.error('Recording error:', error);
      toast.error(
        `Failed to start ${type} recording. Please check permissions.`,
      );
    }
  };

  const pauseRecording = async () => {
    try {
      if (uploadMode === 'audio') {
        const result = await audioRecordingService.pauseRecording();

        if (result.success) {
          setIsPaused(true);
          toast.success(t('media.recordingPaused'));
        } else {
          toast.error(result.error || t('media.failedToPauseRecording'));
        }
      } else if (uploadMode === 'video' && isRecording) {
        setIsPaused(true);
        toast.success('Recording paused');
        // Note: video recorder plugin doesn't support pause
        // We just update UI state for now
      }
    } catch (error) {
      console.error('Pause recording error:', error);
      toast.error('Failed to pause recording');
    }
  };

  const resumeRecording = async () => {
    try {
      if (uploadMode === 'audio') {
        const result = await audioRecordingService.resumeRecording();

        if (result.success) {
          setIsPaused(false);
          toast.success(t('media.recordingResumed'));
        } else {
          toast.error(result.error || t('media.failedToResumeRecording'));
        }
      } else if (uploadMode === 'video' && isRecording && isPaused) {
        setIsPaused(false);
        toast.success('Recording resumed');
        // Note: video recorder plugin doesn't support pause/resume
        // We just update UI state for now
      }
    } catch (error) {
      console.error('Resume recording error:', error);
      toast.error('Failed to resume recording');
    }
  };

  const stopRecording = async () => {
    try {
      if (uploadMode === 'audio') {
        const result = await audioRecordingService.stopRecording();

        if (result.success && result.file) {
          setRecordedBlob(result.file);
          setSelectedFile(result.file);
          setSelectedFiles([result.file]);
          setAudioUrl(URL.createObjectURL(result.file));
          setIsRecording(false);
          setIsPaused(false);
          toast.success(t('media.recordingStopped'));
        } else {
          toast.error(result.error || t('media.failedToStopRecording'));
        }
      } else if (uploadMode === 'video' && isRecording) {
        const result = await videoRecordingService.stopRecording();

        if (result.success && result.file) {
          setRecordedBlob(result.file);
          setSelectedFile(result.file);
          setSelectedFiles([result.file]);
          setVideoUrl(URL.createObjectURL(result.file));
          setIsRecording(false);
          setIsPaused(false);

          // Destroy camera after recording
          await videoRecordingService.destroy();
          setIsVideoInitialized(false);

          toast.success('Recording stopped');
        } else {
          toast.error(result.error || 'Failed to stop recording');
        }
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      toast.error('Failed to stop recording');
    }
  };

  const capturePhoto = async (customFacingMode?: 'user' | 'environment') => {
    try {
      const currentFacingMode = customFacingMode || facingMode;
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setCameraStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current as HTMLVideoElement;
        const canvas = canvasRef.current as HTMLCanvasElement;

        video.srcObject = mediaStream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            video
              .play()
              .then(() => {
                setTimeout(() => {
                  try {
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    const ctx = canvas.getContext('2d');

                    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
                      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                      canvas.toBlob(
                        (blob) => {
                          if (blob) {
                            const file = new File(
                              [blob],
                              'captured-photo.jpg',
                              { type: 'image/jpeg' },
                            );
                            setSelectedFile(file);
                            setSelectedFiles([file]);
                            toast.success(
                              t('common.photoCapturedClickStopCameraWhenDone'),
                            );
                            resolve(blob);
                          } else {
                            reject(new Error('Failed to create blob'));
                          }
                        },
                        'image/jpeg',
                        0.9,
                      );
                    } else {
                      reject(new Error('Video not ready'));
                    }
                  } catch (error) {
                    reject(error);
                  }
                }, 1000);
              })
              .catch(reject);
          };
          video.onerror = reject;
        });
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      toast.error(t('media.failedToCapturePhotoPleaseCheckCameraPermissions'));
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setSelectedFile(null);
    setSelectedFiles([]);
    setRecordingTime(0);
    setAudioUrl(null);
    setVideoUrl(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  };

  const handleSingleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check file limit (max 5 files)
    const currentFileCount = selectedFiles.length;
    const newFilesCount = files.length;
    const totalFiles = currentFileCount + newFilesCount;

    if (totalFiles > 5 || currentFileCount >= 5) {
      toast.error(
        `You can only upload a maximum of 5 files. You already have ${currentFileCount} file(s) selected.`,
      );
      // Only add up to 5 files
      const filesToAdd = Array.from(files).slice(0, 5 - currentFileCount);
      if (filesToAdd.length > 0) {
        const newFiles = [...selectedFiles, ...filesToAdd];
        setSelectedFiles(newFiles);
        // Initialize metadata for new files
        const newMetadata = [...fileMetadata];
        filesToAdd.forEach(() => {
          newMetadata.push({ title: '', description: '' });
        });
        setFileMetadata(newMetadata);
        if (newFiles.length > 0) {
          setSelectedFile(newFiles[0]);
        }
      }
      event.target.value = '';
      return;
    }

    // Add all new files
    const newFiles = [...selectedFiles, ...Array.from(files)];
    setSelectedFiles(newFiles);

    // Initialize metadata for new files
    const newMetadata = [...fileMetadata];
    Array.from(files).forEach(() => {
      newMetadata.push({ title: '', description: '' });
    });
    setFileMetadata(newMetadata);

    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0]);
    }
    // Check file limit (max 5 files)
    const currentFileCount = selectedFiles.length;
    const newFilesCount = files.length;
    const totalFiles = currentFileCount + newFilesCount;

    if (totalFiles > 5 || currentFileCount >= 5) {
      toast.error(
        `You can only upload a maximum of 5 files. You already have ${currentFileCount} file(s) selected.`,
      );
      // Only add up to 5 files
      const filesToAdd = Array.from(files).slice(0, 5 - currentFileCount);
      if (filesToAdd.length > 0) {
        const newFiles = [...selectedFiles, ...filesToAdd];
        setSelectedFiles(newFiles);
        // Initialize metadata for new files
        const newMetadata = [...fileMetadata];
        filesToAdd.forEach(() => {
          newMetadata.push({ title: '', description: '' });
        });
        setFileMetadata(newMetadata);
        if (newFiles.length > 0) {
          setSelectedFile(newFiles[0]);
        }
      }
      event.target.value = '';
      return;
    }

    // Add all new files
    const newFiles = [...selectedFiles, ...Array.from(files)];
    setSelectedFiles(newFiles);

    // Initialize metadata for new files
    const newMetadata = [...fileMetadata];
    Array.from(files).forEach(() => {
      newMetadata.push({ title: '', description: '' });
    });
    setFileMetadata(newMetadata);

    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0]);
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setVideoUrl(null);
    toast.success(`${files.length} file(s) selected`);
    handleFileSelect(event);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    // Also remove the corresponding metadata
    const newMetadata = fileMetadata.filter((_, i) => i !== index);
    setFileMetadata(newMetadata);
    if (newFiles.length === 0) {
      setSelectedFile(null);
    } else if (newFiles.length === 1) {
      setSelectedFile(newFiles[0]);
    }
    toast.success(t('common.fileRemoved'));
  };

  const handleFileSelectInternal = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    handleSingleFileSelect(event);
  };

  const handleUploadWithProgress = async () => {
    setUploadingFiles(true);

    if (uploadMode === 'text') {
      if (!textContent || !description) {
        setUploadingFiles(false);
        return;
      }
      // Create a file from textContent
      const textBlob = new Blob([textContent], { type: 'text/plain' });
      const textFile = new File([textBlob], 'text-content.txt', {
        type: 'text/plain',
      });
      try {
        await onUpload(textFile, description);
      } catch (err) {
        console.error(t('common.textUploadFailed'), err);
        toast.error('Text upload failed');
      }
      setUploadingFiles(false);
      return;
    }

    // For other modes, upload selected files
    if (selectedFiles.length === 0) {
      setUploadingFiles(false);
      return;
    }

    // Validate that each file has title and description
    for (let i = 0; i < selectedFiles.length; i++) {
      const metadata = fileMetadata[i];
      if (!metadata || !metadata.title || metadata.title.trim().length < 8) {
        toast.error(
          `Please provide a title (minimum 8 characters) for file: ${selectedFiles[i].name}`,
        );
        setUploadingFiles(false);
        return;
      }
      if (
        !metadata ||
        !metadata.description ||
        metadata.description.trim().length < 32
      ) {
        toast.error(
          `Please provide a description (minimum 32 characters) for file: ${selectedFiles[i].name}`,
        );
        setUploadingFiles(false);
        return;
      }
    }

    // Upload all files with their individual metadata
    let allUploadsSuccessful = true;
    let failedCount = 0;
    let hasStorageFailure = false;

    // Validate that each file has title and description
    for (let i = 0; i < selectedFiles.length; i++) {
      const metadata = fileMetadata[i];
      if (!metadata || !metadata.title || metadata.title.trim().length < 8) {
        toast.error(
          `Please provide a title (minimum 8 characters) for file: ${selectedFiles[i].name}`,
        );
        setUploadingFiles(false);
        return;
      }
      if (
        !metadata ||
        !metadata.description ||
        metadata.description.trim().length < 32
      ) {
        toast.error(
          `Please provide a description (minimum 32 characters) for file: ${selectedFiles[i].name}`,
        );
        setUploadingFiles(false);
        return;
      }
    }

    // Upload all files with their individual metadata
    let allUploadsSuccessful = true;
    let failedCount = 0;
    let hasStorageFailure = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const metadata = fileMetadata[i];
      console.log(
        `[Bulk Upload] Starting upload ${i + 1}/${selectedFiles.length}:`,
        file.name,
      );
      try {
        const result = await onUpload(
          file,
          metadata.description,
          metadata.title,
        );
        console.log(`[Bulk Upload] Upload ${i + 1} result:`, result);
        if (!result || !result.success) {
          allUploadsSuccessful = false;
          failedCount++;
          if (result?.errorType === 'STORAGE_FAILURE') {
            hasStorageFailure = true;
          }
        }
      const metadata = fileMetadata[i];
      console.log(
        `[Bulk Upload] Starting upload ${i + 1}/${selectedFiles.length}:`,
        file.name,
      );
      try {
        const result = await onUpload(
          file,
          metadata.description,
          metadata.title,
        );
        console.log(`[Bulk Upload] Upload ${i + 1} result:`, result);
        if (!result || !result.success) {
          allUploadsSuccessful = false;
          failedCount++;
          if (result?.errorType === 'STORAGE_FAILURE') {
            hasStorageFailure = true;
          }
        }
      } catch (err) {
        console.error(
          `[Bulk Upload] Upload ${i + 1} exception for ${file.name}:`,
          err,
        );
        console.error(
          `[Bulk Upload] Upload ${i + 1} exception for ${file.name}:`,
          err,
        );
        allUploadsSuccessful = false;
        failedCount++;
        hasStorageFailure = true;
        allUploadsSuccessful = false;
        failedCount++;
        hasStorageFailure = true;
      }
    }

    setUploadingFiles(false);

    console.log(
      `[Bulk Upload] Completed. Success: ${allUploadsSuccessful}, Failed: ${failedCount}, StorageError: ${hasStorageFailure}`,
    );

    // Dismiss any existing toasts first to prevent stacking
    toast.dismiss();

    // Single centralized toast handling - ONLY ONE toast per result
    if (allUploadsSuccessful && selectedFiles.length > 0) {
      toast.success(
        `${selectedFiles.length} file(s) uploaded successfully! Redirecting to Home...`,
      );
      setSelectedFiles([]);
      setFileMetadata([]);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else if (hasStorageFailure) {
      // Storage/API failure - highest priority, show ONLY this toast
      toast.error(
        'Storage upload failed. Please contact admin or retry later.',
      );
    } else if (failedCount > 0) {
      // Partial failure without storage error
      if (failedCount === selectedFiles.length) {
        toast.error(
          'All uploads failed. Please check your files and try again.',
        );
      } else {
        toast.error(
          `${failedCount} of ${selectedFiles.length} uploads failed.`,
        );
      }
    }

    console.log(
      `[Bulk Upload] Completed. Success: ${allUploadsSuccessful}, Failed: ${failedCount}, StorageError: ${hasStorageFailure}`,
    );

    // Dismiss any existing toasts first to prevent stacking
    toast.dismiss();

    // Single centralized toast handling - ONLY ONE toast per result
    if (allUploadsSuccessful && selectedFiles.length > 0) {
      toast.success(
        `${selectedFiles.length} file(s) uploaded successfully! Redirecting to Home...`,
      );
      setSelectedFiles([]);
      setFileMetadata([]);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } else if (hasStorageFailure) {
      // Storage/API failure - highest priority, show ONLY this toast
      toast.error(
        'Storage upload failed. Please contact admin or retry later.',
      );
    } else if (failedCount > 0) {
      // Partial failure without storage error
      if (failedCount === selectedFiles.length) {
        toast.error(
          'All uploads failed. Please check your files and try again.',
        );
      } else {
        toast.error(
          `${failedCount} of ${selectedFiles.length} uploads failed.`,
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Instagram-like Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-slate-900">
              {uploadOptions.find((opt) => opt.type === uploadMode)?.title}
            </h1>
            {selectedCategory && (
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedCategory.title}
              </p>
            )}
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardContent className="p-8">
            {/* Upload Form Header */}
            <div className="flex items-center mb-8">
              <div className="bg-emerald-100 p-3 rounded-lg mr-4">
                {uploadOptions.find((opt) => opt.type === uploadMode)?.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('common.uploadContent')}
                </h2>
                <p className="text-gray-600">
                  {t('ui.choose.how.youd.like.to.contribute')}
                </p>
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isChunkedUploading && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(chunkedUploadProgress) === 100
                      ? 'Uploaded. Analyzing your upload...'
                      : 'Uploading...'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(chunkedUploadProgress)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${chunkedUploadProgress}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Media Upload Component - handles all media types */}
            <MediaUploadComponent
              uploadMode={uploadMode}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              textContent={textContent}
              setTextContent={setTextContent}
              selectedFiles={selectedFiles}
              setSelectedFiles={setSelectedFiles}
              handleFileSelectInternal={handleFileSelectInternal}
              fileInputRef={fileInputRef}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              isPaused={isPaused}
              setIsPaused={setIsPaused}
              recordedBlob={recordedBlob}
              setRecordedBlob={setRecordedBlob}
              recordingTime={recordingTime}
              setRecordingTime={setRecordingTime}
              mediaRecorder={mediaRecorder}
              setMediaRecorder={setMediaRecorder}
              stream={stream}
              setStream={setStream}
              audioUrl={audioUrl}
              setAudioUrl={setAudioUrl}
              videoUrl={videoUrl}
              setVideoUrl={setVideoUrl}
              isCameraActive={isCameraActive}
              setIsCameraActive={setIsCameraActive}
              cameraStream={cameraStream}
              setCameraStream={setCameraStream}
              facingMode={facingMode}
              setFacingMode={setFacingMode}
              videoRef={videoRef}
              videoRecordingRef={videoRecordingRef}
              canvasRef={canvasRef}
              recordingInterval={recordingInterval}
              startRecording={startRecording}
              pauseRecording={pauseRecording}
              resumeRecording={resumeRecording}
              stopRecording={stopRecording}
              capturePhoto={capturePhoto}
              stopCamera={stopCamera}
              switchCamera={switchCamera}
              resetRecording={resetRecording}
              formatTime={formatTime}
              formatFileSize={formatFileSize}
              removeFile={removeFile}
              fileMetadata={fileMetadata}
              setFileMetadata={setFileMetadata}
            />

            {/* Title Input - only show for text mode or when no files are selected */}
            {(uploadMode === 'text' || selectedFiles.length === 0) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.title')}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    if (newTitle.trim().length < 8) {
                      setTitleError(
                        'Title must be at least 8 characters long.',
                      );
                    } else if (countMeaningfulWords(newTitle) < 2) {
                      setTitleError(
                        'Title must contain at least 2 meaningful words.',
                      );
                    } else {
                      setTitleError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder={t('ui.enter.a.title.for.your.content')}
                />
                {titleError && (
                  <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                    {titleError}
                  </div>
                )}
              </div>
            )}

            {/* Description Input - only show for text mode or when no files are selected */}
            {(uploadMode === 'text' || selectedFiles.length === 0) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setDescription(newDescription);
                    if (newDescription.trim().length < 32) {
                      setDescriptionError(
                        'Description must be at least 32 characters long.',
                      );
                    } else if (countMeaningfulWords(newDescription) < 10) {
                      setDescriptionError(
                        'Description must contain at least 10 meaningful words.',
                      );
                    } else {
                      setDescriptionError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-vertical"
                  placeholder={t(
                    'ui.provide.a.detailed.description.minimum.32.characters',
                  )}
            {/* Description Input - only show for text mode or when no files are selected */}
            {(uploadMode === 'text' || selectedFiles.length === 0) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setDescription(newDescription);
                    if (newDescription.trim().length < 32) {
                      setDescriptionError(
                        'Description must be at least 32 characters long.',
                      );
                    } else if (countMeaningfulWords(newDescription) < 10) {
                      setDescriptionError(
                        'Description must contain at least 10 meaningful words.',
                      );
                    } else {
                      setDescriptionError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-vertical"
                  placeholder={t(
                    'ui.provide.a.detailed.description.minimum.32.characters',
                  )}
                />
                {descriptionError && (
                  <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                    {descriptionError}
                  </div>
                )}
              </div>
            {/* Title Input - hide when files are selected for non-text uploads */}
            {(uploadMode === 'text' || selectedFiles.length === 0) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setTitle(newTitle);
                    if (newTitle.trim().length < 8) {
                      setTitleError(
                        'Title must be at least 8 characters long.',
                      );
                    } else if (countMeaningfulWords(newTitle) < 2) {
                      setTitleError(
                        'Title must contain at least 2 meaningful words.',
                      );
                    } else {
                      setTitleError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter a title for your content"
                />
                {titleError && (
                  <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                    {titleError}
                  </div>
                )}
              </div>
            )}

            {/* Description Input - hide when files are selected for non-text uploads */}
            {(uploadMode === 'text' || selectedFiles.length === 0) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setDescription(newDescription);
                    if (newDescription.trim().length < 32) {
                      setDescriptionError(
                        'Description must be at least 32 characters long.',
                      );
                    } else if (countMeaningfulWords(newDescription) < 10) {
                      setDescriptionError(
                        'Description must contain at least 10 meaningful words.',
                      );
                    } else {
                      setDescriptionError(null);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-vertical"
                  placeholder="Provide a detailed description (minimum 32 characters)"
                />
                {descriptionError && (
                  <div className="text-xs text-red-500 mt-1 ml-1 font-medium">
                    {descriptionError}
                  </div>
                )}
              </div>
            )}
            )}

            {/* Multi-Category Selection as Tags */}
            {categories && categories.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.selectCategories')}
                </label>

                {/* Selected Categories Display */}
                <div className="flex flex-wrap gap-2 mb-3 min-h-10 max-h-32 overflow-y-auto p-1">
                  {multiSelectedCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-500 max-w-xs truncate"
                    >
                      <span className="mr-2 truncate max-w-[100px] sm:max-w-[150px]">
                        {cat.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newSelection = multiSelectedCategories.filter(
                            (c) => c.id !== cat.id,
                          );
                          setMultiSelectedCategories(newSelection);
                          if (setSelectedCategories) {
                            setSelectedCategories(newSelection);
                          }
                        }}
                        className="text-emerald-800 hover:text-emerald-900 focus:outline-none flex-shrink-0"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Available Categories */}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                  {categories
                    .filter(
                      (cat) =>
                        !multiSelectedCategories.some(
                          (selected) => selected.id === cat.id,
                        ),
                    )
                    .map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          const newSelection = [
                            ...multiSelectedCategories,
                            cat,
                          ];
                          setMultiSelectedCategories(newSelection);
                          if (setSelectedCategories) {
                            setSelectedCategories(newSelection);
                          }
                        }}
                        className={`cursor-pointer px-3 py-1.5 rounded-full border transition-all duration-200 text-sm max-w-xs truncate ${
                          multiSelectedCategories.some((c) => c.id === cat.id)
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.title}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Location Status */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Location
                </span>
              </div>

              {isVerifyingLocation ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t('user.verifyingLocation')}</span>
                </div>
              ) : verifiedLocation ? (
                <div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {verifiedLocation.formatted_address}
                    </span>
                  </div>
                  <Button
                    onClick={handleEditLocation}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    {t('common.editLocation')}
                  </Button>
                </div>
              ) : locationError ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{locationError}</span>
                </div>
              ) : location ? (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    {t('user.locationCapturedAwaitingVerification')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{t('user.locationRequired')}</span>
                </div>
              )}

              {!location && !verifiedLocation && !isVerifyingLocation && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={requestLocation}
                    size="sm"
                    variant={'outline'}
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    {t('user.useCurrentLocation')}
                  </Button>
                  <Button
                    onClick={() => setShowLocationPicker(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    {t('common.pick.from.map')}
                  </Button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="block font-medium mb-2">
                {t('common.selectLanguage')}
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={selectedLanguage}
                onChange={(e) => setSelectedLangugae(e.target.value)}
              >
                <option value="">{t('common.SelectALanguage')}</option>
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block font-medium mb-2">
                {t('common.release.rights')}
              </label>
              <select
                value={releaseRights}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'downloaded') {
                    toast.error(
                      t(
                        'common.sorryPleaseUploadAnyWorksCreatedByYouOrYouCanUploadWorksOfYourFamilyMembersfriendsWithTheirPermission',
                      ),
                    );
                  }
                  setreleaseRights(value);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {!releaseRights && (
                  <option value="">{t('common.selectReleaseRights')}</option>
                )}
                <option value="creator">
                  {t(
                    'ui.this.work.is.created.by.me.and.anyone.is.free.to.use.it',
                  )}
                </option>
                <option value="others">{t('common.others')}</option>
                <option value="downloaded">
                  {t(
                    'common.iDownloadedThisFromTheInternetAndorIDontKnowIfItIsFreeToShare',
                  )}
                </option>
              </select>

              {releaseRights === 'others' && (
                <div className="mt-3">
                  <label className="block font-medium mb-2">
                    {t('common.creator')}
                  </label>
                  <input
                    type="text"
                    value={creator}
                    onChange={(e) => setCreator(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('ui.enter.a.creator.for.your.content')}
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleUploadWithProgress}
                disabled={
                  uploading ||
                  uploadingFiles ||
                  !verifiedLocation || // <-- Key change: Disable button until location is VERIFIED
                  !releaseRights ||
                  releaseRights === 'downloaded' ||
                  !selectedLanguage ||
                  (uploadMode === 'text' && !textContent) ||
                  // For non-text uploads, check if files are selected
                  (uploadMode !== 'text' && selectedFiles.length === 0)
                    ? true
                    : false
                }
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium text-lg"
              >
                {uploading || uploadingFiles
                  ? 'Uploading...'
                  : 'Upload Content'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onLocationSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default ContentInput;
