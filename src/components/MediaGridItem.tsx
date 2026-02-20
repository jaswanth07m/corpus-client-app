import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X, Pencil, History, Clock } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { MediaDetailModal } from './MediaDetailModal';

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

interface MediaGridItemProps {
  item: ContributionItem;
  mediaType: 'text' | 'audio' | 'video' | 'image' | 'document';
  token: string;
  isOwnProfile: boolean;
}

export const MediaGridItem: React.FC<MediaGridItemProps> = ({
  item,
  mediaType,
  token,
  isOwnProfile,
}) => {
  const { t } = useTranslation();
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  // Lazy load media URL for all media types
  useEffect(() => {
    if (shouldLoad && !mediaUrl) {
      const fetchMediaUrl = async () => {
        setLoading(true);
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
      };

      fetchMediaUrl();
    }
  }, [item.id, token, shouldLoad, mediaUrl]);

  const getMediaPreview = () => {
    if (mediaType === 'image') {
      return (
        <>
          {shouldLoad && loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
            </div>
          )}
          {shouldLoad && error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-3 sm:p-4">
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-1 sm:mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-xs text-gray-500">
                  {t('media.imageUnavailable')}
                </p>
              </div>
            </div>
          )}
          {shouldLoad && mediaUrl && !loading && !error && (
            <img
              src={mediaUrl}
              alt={item.title || 'Image'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={() => setError(true)}
            />
          )}
        </>
      );
    } else {
      // For non-image media types (text, audio, video, document)
      return (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-3 sm:p-4">
                <p className="text-xs text-gray-500">
                  {t('common.media.unavailable')}
                </p>
              </div>
            </div>
          )}
          {!loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white to-gray-50">
              {getMediaIcon(mediaType)}
            </div>
          )}
        </>
      );
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500"
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
        );
      case 'audio':
        return (
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-green-500"
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
        );
      case 'document':
        return (
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-600"
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
        );
      case 'video':
        return (
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500"
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
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        onClick={() => {
          setShouldLoad(true);
          setShowModal(true);
        }}
        onMouseEnter={() => setShouldLoad(true)}
        className="group relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      >
        {/* Media Container */}
        <div className="aspect-square relative overflow-hidden bg-white">
          {/* Placeholder for non-loaded images */}
          {!shouldLoad && mediaType === 'image' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-orange-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {getMediaPreview()}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
              <p className="font-semibold text-xs sm:text-sm truncate">
                {item.title || 'Untitled'}
              </p>
              <p className="text-xs opacity-90">{item.language || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-3 sm:p-4 bg-white">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm mb-1 sm:mb-2 truncate">
            {item.title || 'Untitled'}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {item.description || 'No description'}
          </p>
        </div>
      </div>

      {/* Modal */}
      <MediaDetailModal
        item={item}
        mediaType={mediaType}
        previewUrl={mediaUrl}
        token={token}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        isOwnProfile={isOwnProfile}
      />
    </>
  );
};
