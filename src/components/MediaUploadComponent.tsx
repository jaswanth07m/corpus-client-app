import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Mic,
  Video,
  Camera,
  FileText,
  Upload,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploadComponentProps {
  uploadMode: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  textContent: string;
  setTextContent: (content: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;
  handleFileSelectInternal: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isRecording?: boolean;
  setIsRecording?: (recording: boolean) => void;
  isPaused?: boolean;
  setIsPaused?: (paused: boolean) => void;
  recordedBlob?: Blob | null;
  setRecordedBlob?: (blob: Blob | null) => void;
  recordingTime?: number;
  setRecordingTime?: (time: number) => void;
  mediaRecorder?: MediaRecorder | null;
  setMediaRecorder?: (recorder: MediaRecorder | null) => void;
  stream?: MediaStream | null;
  setStream?: (stream: MediaStream | null) => void;
  audioUrl?: string | null;
  setAudioUrl?: (url: string | null) => void;
  videoUrl?: string | null;
  setVideoUrl?: (url: string | null) => void;
  isCameraActive?: boolean;
  setIsCameraActive?: (active: boolean) => void;
  cameraStream?: MediaStream | null;
  setCameraStream?: (stream: MediaStream | null) => void;
  facingMode?: 'user' | 'environment';
  setFacingMode?: (mode: 'user' | 'environment') => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  videoRecordingRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  recordingInterval?: React.MutableRefObject<NodeJS.Timeout | null>;
  startRecording?: (
    type: 'audio' | 'video',
    customFacingMode?: 'user' | 'environment',
  ) => void;
  pauseRecording?: () => void;
  resumeRecording?: () => void;
  stopRecording?: () => void;
  capturePhoto?: (customFacingMode?: 'user' | 'environment') => void;
  stopCamera?: () => void;
  switchCamera?: () => void;
  resetRecording?: () => void;
  formatTime?: (seconds: number) => string;
  formatFileSize: (bytes: number) => string;
  removeFile: (index: number) => void;
  // Per-file metadata props
  fileMetadata?: { title: string; description: string }[];
  setFileMetadata?: (
    metadata: { title: string; description: string }[],
  ) => void;
}

const MediaUploadComponent: React.FC<MediaUploadComponentProps> = ({
  uploadMode,
  selectedFile,
  setSelectedFile,
  textContent,
  setTextContent,
  selectedFiles,
  setSelectedFiles,
  handleFileSelectInternal,
  fileInputRef,
  isRecording,
  setIsRecording,
  isPaused,
  setIsPaused,
  recordedBlob,
  setRecordedBlob,
  recordingTime,
  setRecordingTime,
  mediaRecorder,
  setMediaRecorder,
  stream,
  setStream,
  audioUrl,
  setAudioUrl,
  videoUrl,
  setVideoUrl,
  isCameraActive,
  setIsCameraActive,
  cameraStream,
  setCameraStream,
  facingMode,
  setFacingMode,
  videoRef,
  videoRecordingRef,
  canvasRef,
  recordingInterval,
  startRecording,
  pauseRecording,
  resumeRecording,
  stopRecording,
  capturePhoto,
  stopCamera,
  switchCamera,
  resetRecording,
  formatTime,
  formatFileSize,
  removeFile,
  fileMetadata = [],
  setFileMetadata,
}) => {
  const { t } = useTranslation();

  // Handler to update file metadata (title/description)
  const updateFileMetadata = (
    index: number,
    field: 'title' | 'description',
    value: string,
  ) => {
    if (setFileMetadata) {
      const newMetadata = [...fileMetadata];
      if (newMetadata[index]) {
        newMetadata[index] = { ...newMetadata[index], [field]: value };
      } else {
        newMetadata[index] = { title: '', description: '' };
        newMetadata[index][field] = value;
      }
      setFileMetadata(newMetadata);
    }
  };
  if (!uploadMode) return null;

  // Document upload component - should be first to maintain consistent order
  if (uploadMode === 'document') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('common.documentUpload')}
        </label>
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            onChange={handleFileSelectInternal}
            className="hidden"
          />
          <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <span className="text-gray-600 text-sm sm:text-base">
              {t('common.uploadDocumentFilesPdfDocxTxtMax5Files')}
            </span>
          </div>
        </label>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-700">Selected Files:</h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-lg gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {/* Per-file title and description inputs */}
            {selectedFiles.map((file, index) => (
              <div
                key={`metadata-${index}`}
                className="p-3 bg-white border rounded-lg space-y-2"
              >
                <div className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </div>
                <input
                  type="text"
                  value={fileMetadata[index]?.title || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'title', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Title for ${file.name}`}
                />
                <textarea
                  value={fileMetadata[index]?.description || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'description', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20 resize-none"
                  placeholder={`Description for ${file.name}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Text input component
  if (uploadMode === 'text') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('common.content')}
        </label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32 resize-vertical"
          placeholder={t('ui.enter.your.text.content.here')}
        />
      </div>
    );
  }

  // Audio recording component
  if (uploadMode === 'audio') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('media.audioRecording')}
        </label>

        {!isRecording && !recordedBlob && (
          <Button
            onClick={() => startRecording?.('audio')}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg"
          >
            <Mic className="w-5 h-5 mr-2" />
            {t('media.startRecording')}
          </Button>
        )}

        {isRecording && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-mono text-red-600">
              {formatTime?.(recordingTime || 0)}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              {!isPaused ? (
                <Button
                  onClick={pauseRecording}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeRecording}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                <Square className="w-5 h-5 mr-2" />
                {t('media.stopRecording')}
              </Button>
            </div>
            {isPaused && (
              <div className="text-sm text-orange-600 font-medium">
                {t('media.recordingPaused')}
              </div>
            )}
          </div>
        )}

        {recordedBlob && audioUrl && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg gap-2">
              <span className="text-green-700 font-medium text-sm truncate max-w-full">
                {t('media.recordingCompleted')}
                {formatTime?.(recordingTime || 0)}
              </span>
              <Button
                onClick={resetRecording}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('media.recordAgain')}
              </Button>
            </div>
            <div className="flex justify-center">
              <audio controls className="w-full max-w-full">
                <source src={audioUrl} />
                {t('common.yourBrowserDoesNotSupportTheAudioElement')}
              </audio>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-center text-gray-500 mb-2">OR</div>
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelectInternal}
              className="hidden"
            />
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <span className="text-gray-600">
                {t('common.uploadAudioFilesMax5Files')}
              </span>
            </div>
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !recordedBlob && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-700">Selected File:</h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mic className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {/* Per-file title and description inputs */}
            {selectedFiles.map((file, index) => (
              <div
                key={`metadata-${index}`}
                className="p-3 bg-white border rounded-lg space-y-2"
              >
                <div className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </div>
                <input
                  type="text"
                  value={fileMetadata[index]?.title || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'title', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Title for ${file.name}`}
                />
                <textarea
                  value={fileMetadata[index]?.description || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'description', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20 resize-none"
                  placeholder={`Description for ${file.name}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Video recording component
  if (uploadMode === 'video') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('media.videoRecording')}
        </label>

        {/* Camera Switch Button - show when recording */}
        {isRecording && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={switchCamera}
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white/90 text-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('common.switch.to')}
              {facingMode === 'user' ? 'Rear' : 'Front'} Camera
            </Button>
          </div>
        )}

        {/* Video preview - show during recording */}
        <video
          ref={videoRecordingRef}
          muted
          playsInline
          className={`w-full max-w-full rounded-lg mb-4 ${isRecording ? 'block' : 'hidden'}`}
          style={{ maxHeight: '70vh', backgroundColor: '#000' }}
        />

        {!isRecording && !recordedBlob && (
          <Button
            onClick={() => startRecording?.('video')}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg"
          >
            <Video className="w-5 h-5 mr-2" />
            {t('media.startVideoRecording')}
          </Button>
        )}

        {isRecording && (
          <div className="text-center space-y-4">
            <div className="text-2xl font-mono text-red-600">
              {formatTime?.(recordingTime || 0)}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              {!isPaused ? (
                <Button
                  onClick={pauseRecording}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={resumeRecording}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              <Button
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                <Square className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            </div>
            {isPaused && (
              <div className="text-sm text-orange-600 font-medium">
                Recording paused
              </div>
            )}
          </div>
        )}

        {recordedBlob && videoUrl && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg gap-2">
              <span className="text-green-700 font-medium text-sm truncate max-w-full">
                Recording completed ({formatTime?.(recordingTime || 0)})
              </span>
              <Button
                onClick={resetRecording}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Record Again
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="max-w-full overflow-hidden">
                <video
                  controls
                  className="w-full max-w-full max-h-48 object-contain rounded-lg"
                >
                  <source src={videoUrl} />
                  {t('common.yourBrowserDoesNotSupportTheVideoElement')}
                </video>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-center text-gray-500 mb-2">OR</div>
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleFileSelectInternal}
              className="hidden"
            />
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <span className="text-gray-600 text-sm sm:text-base">
                {t('common.uploadVideoFilesMax5Files')}
              </span>
            </div>
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !recordedBlob && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-gray-700">
              {t('common.selectedFiles')}
            </h4>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => removeFile(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {/* Per-file title and description inputs */}
            {selectedFiles.map((file, index) => (
              <div
                key={`metadata-${index}`}
                className="p-3 bg-white border rounded-lg space-y-2"
              >
                <div className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </div>
                <input
                  type="text"
                  value={fileMetadata[index]?.title || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'title', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={`Title for ${file.name}`}
                />
                <textarea
                  value={fileMetadata[index]?.description || ''}
                  onChange={(e) =>
                    updateFileMetadata(index, 'description', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20 resize-none"
                  placeholder={`Description for ${file.name}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Image capture component
  if (uploadMode === 'image') {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('media.photoCapture')}
        </label>

        {/* Camera Switch Button - show when camera is active */}
        {isCameraActive && (
          <div className="flex justify-center mb-4">
            <Button
              onClick={switchCamera}
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white/90 text-gray-700 text-xs sm:text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Switch to {facingMode === 'user' ? 'Rear' : 'Front'} Camera
            </Button>
          </div>
        )}

        {/* Camera preview */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full max-w-full rounded-lg mb-4 ${isCameraActive ? 'block' : 'hidden'}`}
          style={{ maxHeight: '70vh', backgroundColor: '#000' }}
        />

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!isCameraActive && !selectedFile && (
          <Button
            onClick={() => capturePhoto?.()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {t('media.startCamera')}
          </Button>
        )}

        {isCameraActive && (
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              <Button
                onClick={() => capturePhoto?.()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
              >
                <Camera className="w-5 h-5 mr-2" />
                {t('media.capturePhoto')}
              </Button>
              <Button
                onClick={stopCamera}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                <Square className="w-5 h-5 mr-2" />
                {t('media.stopCamera')}
              </Button>
            </div>
          </div>
        )}

        {selectedFile && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg gap-2">
              <span className="text-green-700 font-medium text-sm truncate max-w-full">
                {t('media.photoCaptured')}
                {selectedFile.name}
              </span>
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFiles([]);
                }}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('common.takeAnother')}
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="max-w-full overflow-hidden">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt={t('media.capturedPhoto')}
                  className="max-w-full max-h-48 w-auto object-contain rounded-lg border"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="text-center text-gray-500 mb-2">OR</div>
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelectInternal}
              className="hidden"
            />
            <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <span className="text-gray-600 text-sm sm:text-base">
                {t('common.uploadImageFilesMax5Files')}
              </span>
            </div>
          </label>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-gray-700">Selected Files:</h4>
            {selectedFiles.map((file, index) => (
              <div key={index} className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Camera className="w-4 h-4 text-gray-500" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => removeFile(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {/* Preview for image files */}
                {file.type.startsWith('image/') && (
                  <div className="flex justify-center">
                    <div className="max-w-full overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="max-w-full max-h-48 object-contain rounded-lg border mx-auto"
                      />
                    </div>
                  </div>
                )}
                {/* Per-file title and description inputs */}
                <div className="p-3 bg-white border rounded-lg space-y-2">
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {file.name}
                  </div>
                  <input
                    type="text"
                    value={fileMetadata[index]?.title || ''}
                    onChange={(e) =>
                      updateFileMetadata(index, 'title', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={`Title for ${file.name}`}
                  />
                  <textarea
                    value={fileMetadata[index]?.description || ''}
                    onChange={(e) =>
                      updateFileMetadata(index, 'description', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20 resize-none"
                    placeholder={`Description for ${file.name}`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default MediaUploadComponent;
