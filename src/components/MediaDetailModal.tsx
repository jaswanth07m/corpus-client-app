import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  X,
  Pencil,
  History,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatSizeMB } from '@/lib/utils';
import CategoryTags from '@/components/CategoryTags';
import { InlineEditHistory } from './InlineEditHistory';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

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

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ContributionItem {
  id: string;
  size: number;
  category_id?: string; // Keep for backward compatibility
  category_ids?: string[]; // New field for multiple categories
  reviewed: boolean;
  title: string;
  description: string;
  duration?: number;
  timestamp?: string;
  location?: Coordinates;
  release_rights: string;
  creator: string;
  language: string;
  file_hash: string;
  snr_frequency: number;
}

interface MediaDetailModalProps {
  item: ContributionItem;
  mediaType: 'text' | 'audio' | 'video' | 'image' | 'document';
  previewUrl: string | null;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  isOwnProfile: boolean;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  mediaType,
  previewUrl,
  token,
  isOpen,
  onClose,
  isOwnProfile,
}) => {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<ContributionItem>({ ...item });
  const [sourceLabel, setSourceLabel] = useState<string>('');

  // Effect to hide bottom navigation when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [descError, setDescError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Function to count meaningful words
  const countMeaningfulWords = (s: string) =>
    s.split(' ').filter((w) => w.trim().length > 2).length;

  // Function to fetch media URL on demand
  const fetchMediaUrl = useCallback(async () => {
    if (!isOpen || mediaUrl) return; // Don't fetch if modal is closed or already have URL

    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `${BACKEND_URL}/records/${item.id}/record-url?expires_minutes=60`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch media URL');
      }

      const data = await response.json();
      if (data.record_url) {
        setMediaUrl(data.record_url);
      }
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [isOpen, mediaUrl, item.id, token]);

  // Fetch media URL only when needed for audio, document, and video types
  useEffect(() => {
    if (
      isOpen &&
      !previewUrl &&
      (mediaType === 'audio' ||
        mediaType === 'document' ||
        mediaType === 'video')
    ) {
      fetchMediaUrl();
    }
  }, [isOpen, previewUrl, mediaType, fetchMediaUrl]);

  if (!isOpen) return null;

  const getMediaTypeLabel = () => {
    return mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
  };

  const renderMediaPreview = () => {
    switch (mediaType) {
      case 'image':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg max-h-[50vh]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={item.title || 'Image'}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg max-h-[50vh]">
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs text-gray-500">
                    {t('media.videoUnavailable')}
                  </p>
                </div>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain bg-black"
                onError={() => setError(true)}
                data-testid="video-element"
              />
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {t('media.loadVideo')}
                </button>
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center p-4 max-h-[30vh]">
            {loading && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="text-center p-4">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <p className="text-xs text-gray-500">
                  {t('media.audioUnavailable')}
                </p>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <audio
                  src={mediaUrl}
                  controls
                  className="w-full max-w-xs"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setError(true)}
                  data-testid="audio-element"
                />
              </div>
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                    />
                  </svg>
                </div>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t('media.loadAudio')}
                </button>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center max-h-[50vh]">
            {loading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {error && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <svg
                    className="w-12 h-12 mx-auto text-gray-400 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-xs text-gray-500">
                    {t('media.documentUnavailable')}
                  </p>
                </div>
              </div>
            )}
            {!loading && !error && mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                {/* Check document type and render appropriate preview */}
                {mediaUrl && (
                  <div className="w-full h-full flex flex-col items-center">
                    {mediaUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe
                        src={mediaUrl}
                        className="w-full h-full border-0"
                        title={t('common.documentPreview')}
                      />
                    ) : mediaUrl.toLowerCase().endsWith('.docx') ||
                      mediaUrl.toLowerCase().endsWith('.doc') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Word Document'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Microsoft Word Document'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          {t('common.openInNewTab')}
                        </a>
                      </div>
                    ) : mediaUrl.toLowerCase().endsWith('.txt') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Text File'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Plain Text Document'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          View Text
                        </a>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-white border-0 p-4">
                        <div className="mb-2">
                          <svg
                            className="w-16 h-16 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-4">
                          {item.title || 'Document'}
                        </p>
                        <p className="text-gray-500 mb-6 text-center max-w-md">
                          {item.description || 'Document File'}
                        </p>
                        <a
                          href={mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg"
                        >
                          {t('common.openDocument')}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {!loading && !error && !mediaUrl && (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-center text-gray-600 mb-4">
                  {item.title || 'Document'}
                </p>
                <button
                  onClick={fetchMediaUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('media.loadDocument')}
                </button>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center max-h-[30vh]">
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-center text-gray-600 mb-4">
                {item.title || 'Text Content'}
              </p>
              <a
                href={previewUrl || mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('common.viewText')}
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-lg flex items-center justify-center">
            <div className="text-center p-4">
              <p className="text-xs text-gray-500">
                {t('categories.unsupportedMediaType')}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {getMediaTypeLabel()} Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600 hidden sm:block" />
            <X size={20} className="text-gray-600 sm:hidden" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Media Preview */}
            <div className="space-y-4 max-w-2xl mx-auto">
              {renderMediaPreview()}

              {/* Action Buttons - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={async () => {
                        // Clear any previous submit errors
                        setSubmitError(null);

                        // Validate inputs before submitting
                        let hasErrors = false;

                        if (
                          !editItem.title ||
                          editItem.title.trim().length < 8
                        ) {
                          setTitleError(
                            'Title must be at least 8 characters long.',
                          );
                          hasErrors = true;
                        } else if (countMeaningfulWords(editItem.title) < 2) {
                          setTitleError(
                            'Title must contain at least 2 meaningful words.',
                          );
                          hasErrors = true;
                        } else {
                          setTitleError(null);
                        }

                        if (
                          !editItem.description ||
                          editItem.description.trim().length < 32
                        ) {
                          setDescError(
                            'Description must be at least 32 characters long.',
                          );
                          hasErrors = true;
                        } else if (
                          countMeaningfulWords(editItem.description) < 10
                        ) {
                          setDescError(
                            'Description must contain at least 10 meaningful words.',
                          );
                          hasErrors = true;
                        } else {
                          setDescError(null);
                        }

                        // Check if release rights is 'others' and if source label or creator is required
                        if (editItem.release_rights === 'others') {
                          if (
                            isOwnProfile &&
                            (!editItem.creator ||
                              editItem.creator.trim() === '')
                          ) {
                            // Creator is required for own profile when release rights is 'others'
                            // For now we'll just show a general error, but we could add a specific state for this
                            setSubmitError(
                              'Creator is required when release rights is set to "Not Done By Author"',
                            );
                            hasErrors = true;
                          } else if (
                            !isOwnProfile &&
                            (!sourceLabel || sourceLabel.trim() === '')
                          ) {
                            // Source label is required for other profiles when release rights is 'others'
                            setSubmitError(
                              'Source label is required when release rights is set to "Not Done By Author"',
                            );
                            hasErrors = true;
                          }
                        }

                        if (hasErrors) {
                          return; // Don't submit if there are validation errors
                        }

                        // Check if there are actual changes to save
                        if (
                          item.title === editItem.title &&
                          item.description === editItem.description &&
                          item.language === editItem.language &&
                          item.release_rights === editItem.release_rights &&
                          item.creator === editItem.creator &&
                          (!isOwnProfile || sourceLabel === '') // Only check sourceLabel if on other's profile
                        ) {
                          toast.info(t('common.noChangesToSave'));
                          return;
                        }

                        try {
                          const response = await fetch(
                            `${BACKEND_URL}/records/${editItem.id}`,
                            {
                              method: 'PATCH',
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                title: editItem.title,
                                description: editItem.description,
                                language: editItem.language,
                                release_rights: editItem.release_rights,
                                ...(editItem.release_rights === 'others' &&
                                isOwnProfile &&
                                editItem.creator
                                  ? { creator: editItem.creator }
                                  : {}),
                                ...(editItem.release_rights === 'others' &&
                                !isOwnProfile &&
                                sourceLabel
                                  ? { source_label: sourceLabel }
                                  : {}),
                                // Add other fields that can be edited if needed
                              }),
                            },
                          );

                          if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(
                              errorData.detail || 'Failed to update record',
                            );
                          }

                          // Update the original item with edited values
                          item.title = editItem.title;
                          item.description = editItem.description;
                          item.language = editItem.language;
                          item.release_rights = editItem.release_rights;
                          item.creator = editItem.creator;

                          setIsEditing(false);
                        } catch (error) {
                          console.error('Error updating record:', error);
                          setSubmitError(
                            `Error updating record: ${error instanceof Error ? error.message : 'Unknown error'}`,
                          );
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-green-200 hover:border-green-600"
                    >
                      <span className="text-sm font-semibold">Save</span>
                    </button>
                    <button
                      onClick={() => {
                        // Cancel editing and revert changes
                        setEditItem({ ...item });
                        setSourceLabel(''); // Reset source label
                        setTitleError(null); // Reset validation errors
                        setDescError(null);
                        setSubmitError(null);
                        setIsEditing(false);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-600"
                    >
                      <span className="text-sm font-semibold">Cancel</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        // Initialize validation states
                        setTitleError(null);
                        setDescError(null);
                        setSubmitError(null);
                        // Initialize source label if release rights is 'others'
                        if (item.release_rights === 'others') {
                          setSourceLabel(''); // Initialize to empty, it will be populated if needed
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-blue-200 hover:border-blue-600"
                    >
                      <Pencil size={18} />
                      <span className="text-sm font-semibold">Edit</span>
                    </button>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex-1 px-4 py-2 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-purple-200 hover:border-purple-600"
                    >
                      <History size={18} />
                      <span className="text-sm font-semibold">
                        {showHistory ? 'Hide History' : 'View History'}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Title and Description */}
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editItem.title}
                        onChange={(e) => {
                          const t = e.target.value;
                          setEditItem({ ...editItem, title: t });
                          if (t.trim().length < 8) {
                            setTitleError(
                              'Title must be at least 8 characters long.',
                            );
                          } else if (countMeaningfulWords(t) < 2) {
                            setTitleError(
                              'Title must contain at least 2 meaningful words.',
                            );
                          } else {
                            setTitleError(null);
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          titleError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {titleError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {titleError}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editItem.description}
                        onChange={(e) => {
                          const d = e.target.value;
                          setEditItem({ ...editItem, description: d });
                          if (d.trim().length < 32) {
                            setDescError(
                              'Description must be at least 32 characters long.',
                            );
                          } else if (countMeaningfulWords(d) < 10) {
                            setDescError(
                              'Description must contain at least 10 meaningful words.',
                            );
                          } else {
                            setDescError(null);
                          }
                        }}
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                          descError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {descError && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {descError}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {countMeaningfulWords(editItem.description || '')}{' '}
                        {t('common.meaningful.words')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                      {item.title || 'Untitled'}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description || 'No description available'}
                    </p>
                  </>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-3 sm:p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Information
                </h4>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <Clock
                    size={18}
                    className="text-gray-400 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Timestamp
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })
                        : 'Not available'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.414A1 1 0 0112.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      Location
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.location &&
                      typeof item.location.latitude === 'number' &&
                      typeof item.location.longitude === 'number'
                        ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`
                        : 'Not available'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                  <svg
                    className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">
                      {t('media.fileSize')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.size ? formatSizeMB(item.size) : 'Not available'}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <Select
                      value={editItem.language}
                      onValueChange={(val) =>
                        setEditItem({ ...editItem, language: val })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={editItem.language || 'Select language'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                    <svg
                      className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">
                        Language
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.language || 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Release Rights
                      </label>
                      <Select
                        value={editItem.release_rights}
                        onValueChange={(val) => {
                          setEditItem((prev) => ({
                            ...prev,
                            release_rights: val,
                            // Clear creator field if not 'others'
                            creator: val !== 'others' ? '' : prev.creator,
                          }));
                          // Clear sourceLabel if not 'others'
                          if (val !== 'others') {
                            setSourceLabel('');
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              editItem.release_rights || 'Select release rights'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="creator">
                            {t(
                              'ui.this.work.is.created.by.me.and.anyone.is.free.to.use.it',
                            )}
                          </SelectItem>
                          <SelectItem value="others">
                            {t('common.notDoneByAuthor')}
                          </SelectItem>
                          <SelectItem value="downloaded">
                            {t(
                              'common.iDownloadedThisFromTheInternetAndorIDontKnowIfItIsFreeToShare',
                            )}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {editItem.release_rights === 'others' && (
                      <>
                        {isOwnProfile ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Creator
                            </label>
                            <input
                              type="text"
                              value={editItem.creator}
                              onChange={(e) =>
                                setEditItem({
                                  ...editItem,
                                  creator: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t('common.specify.creator')}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('categories.sourceLabel')}
                            </label>
                            <input
                              type="text"
                              value={sourceLabel}
                              onChange={(e) => setSourceLabel(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder={t('common.specify.source')}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                      <svg
                        className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {t('common.release.rights')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.release_rights || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {/* Category Tags */}
                    <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3">
                      <svg
                        className="w-[18px] h-[18px] text-gray-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          Categories
                        </p>
                        <div className="mt-1">
                          <CategoryTags
                            categoryIds={
                              item.category_ids ||
                              (item.category_id ? [item.category_id] : [])
                            }
                            token={token}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {item.reviewed && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
                      {t('common.Reviewed')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit History Section */}
          {showHistory && (
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
              <InlineEditHistory recordId={item.id} token={token} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
