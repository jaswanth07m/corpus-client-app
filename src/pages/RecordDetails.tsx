import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, User } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatSizeMB, formatDuration, getISTDate } from '@/lib/utils';
import { ContributionItem } from '@/components/MediaDetailModal';

const RecordDetails: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!recordId) return;

      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${BACKEND_URL}/records/${recordId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecord(data);

        // Fetch file size from media URL if record size is 0 or undefined
        if (!data.size || data.size === 0) {
          fetchFileSize(recordId, token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId]);

  const fetchFileSize = async (id: string, token: string) => {
    try {
      const urlResponse = await fetch(
        `${BACKEND_URL}/records/${id}/record-url?expires_minutes=60`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (urlResponse.ok) {
        const urlData = await urlResponse.json();
        if (urlData.record_url) {
          const headResponse = await fetch(urlData.record_url, {
            method: 'HEAD',
          });
          const contentLength = headResponse.headers.get('Content-Length');
          if (contentLength) {
            setFileSize(parseInt(contentLength, 10));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching file size:', err);
    }
  };

  const fetchMediaUrl = async () => {
    if (!recordId || mediaUrl) return;

    setMediaLoading(true);
    setMediaError(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/records/${recordId}/record-url?expires_minutes=60`,
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
      setMediaError(true);
    } finally {
      setMediaLoading(false);
    }
  };

  // Determine media type from record properties
  const getMediaType = () => {
    if (!record) return 'document';

    // Check if media_type exists
    if (record.media_type) return record.media_type;

    // Check title/description for file extensions
    const title = (record.title || '').toLowerCase();
    const description = (record.description || '').toLowerCase();
    const combined = title + ' ' + description;

    // Video extensions
    if (
      combined.includes('.mp4') ||
      combined.includes('.mov') ||
      combined.includes('.avi') ||
      combined.includes('.mkv') ||
      combined.includes('.webm') ||
      combined.includes('.flv') ||
      combined.includes('.wmv')
    ) {
      return 'video';
    }

    // Image extensions
    if (
      combined.includes('.jpg') ||
      combined.includes('.jpeg') ||
      combined.includes('.png') ||
      combined.includes('.gif') ||
      combined.includes('.webp') ||
      combined.includes('.bmp')
    ) {
      return 'image';
    }

    // Audio extensions
    if (
      combined.includes('.mp3') ||
      combined.includes('.wav') ||
      combined.includes('.ogg') ||
      combined.includes('.flac') ||
      combined.includes('.aac') ||
      combined.includes('.m4a')
    ) {
      return 'audio';
    }

    // Document extensions
    if (
      combined.includes('.pdf') ||
      combined.includes('.doc') ||
      combined.includes('.docx') ||
      combined.includes('.txt') ||
      combined.includes('.xls') ||
      combined.includes('.xlsx')
    ) {
      return 'document';
    }

    // Check if duration exists (audio or video)
    if (record.duration && record.duration > 0) {
      return 'audio';
    }

    // Default to document/text
    return 'document';
  };

  const mediaType = getMediaType();

  // Create a modified record with the fetched file size
  const displayRecord = record
    ? {
        ...record,
        size: fileSize !== null ? fileSize : record.size,
      }
    : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading record details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!displayRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-gray-600 mb-4">Record not found</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Record Details</h1>
      </div>

      {/* User Profile Button */}
      {displayRecord && (
        <Link
          to={`/profile/${displayRecord.user_id || displayRecord.user_name || displayRecord.username || ''}`}
          className="flex items-center gap-3 mb-6 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {displayRecord.creator ||
                displayRecord.user_name ||
                displayRecord.username ||
                'Unknown User'}
            </p>
            <p className="text-sm text-gray-500">
              @
              {displayRecord.user_name ||
                displayRecord.username ||
                displayRecord.user_id ||
                'unknown'}
            </p>
          </div>
        </Link>
      )}

      {/* Media Preview */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Media Preview</h2>
        </div>
        <div className="p-4">
          {mediaType === 'image' && (
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg max-h-[400px]">
              {mediaLoading && (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </div>
              )}
              {mediaError && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center p-4">
                    <p className="text-xs text-gray-500">Image unavailable</p>
                  </div>
                </div>
              )}
              {!mediaLoading && !mediaError && mediaUrl && (
                <img
                  src={mediaUrl}
                  alt={displayRecord.title || 'Image'}
                  className="w-full h-full object-contain"
                  onError={() => setMediaError(true)}
                />
              )}
              {!mediaLoading && !mediaError && !mediaUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
                  <button
                    onClick={fetchMediaUrl}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Load Image
                  </button>
                </div>
              )}
            </div>
          )}

          {mediaType === 'video' && (
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg">
              {mediaLoading && (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </div>
              )}
              {mediaError && (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center p-4">
                    <p className="text-xs text-gray-500">Video unavailable</p>
                  </div>
                </div>
              )}
              {!mediaLoading && !mediaError && mediaUrl && (
                <video
                  src={mediaUrl}
                  controls
                  className="w-full h-full object-contain bg-black"
                  onError={() => setMediaError(true)}
                />
              )}
              {!mediaLoading && !mediaError && !mediaUrl && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 p-4">
                  <button
                    onClick={fetchMediaUrl}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Load Video
                  </button>
                </div>
              )}
            </div>
          )}

          {mediaType === 'audio' && (
            <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg p-6">
              {mediaLoading && (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                </div>
              )}
              {mediaError && (
                <div className="flex items-center justify-center bg-gray-100">
                  <div className="text-center p-4">
                    <p className="text-xs text-gray-500">Audio unavailable</p>
                  </div>
                </div>
              )}
              {!mediaLoading && !mediaError && mediaUrl && (
                <div className="flex flex-col items-center">
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
                    className="w-full max-w-md"
                    onError={() => setMediaError(true)}
                  />
                </div>
              )}
              {!mediaLoading && !mediaError && !mediaUrl && (
                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
                  <button
                    onClick={fetchMediaUrl}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Load Audio
                  </button>
                </div>
              )}
            </div>
          )}

          {(!mediaType || mediaType === 'text' || mediaType === 'document') && (
            <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg p-6">
              <div className="flex flex-col items-center justify-center">
                <svg
                  className="w-16 h-16 text-blue-500 mb-4"
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
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {displayRecord.title || 'Document'}
                </p>
                {mediaUrl && (
                  <a
                    href={mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Document
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Details Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Record Details
          </h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div>
            <p className="text-sm text-gray-500">Title</p>
            <p className="font-medium text-gray-900">
              {displayRecord.title || 'Untitled'}
            </p>
          </div>

          {/* Language */}
          <div>
            <p className="text-sm text-gray-500">Language</p>
            <p className="font-medium text-gray-900 capitalize">
              {displayRecord.language || 'N/A'}
            </p>
          </div>

          {/* Size */}
          <div>
            <p className="text-sm text-gray-500">Size</p>
            <p className="font-medium text-gray-900">
              {displayRecord.size > 0
                ? formatSizeMB(displayRecord.size)
                : 'N/A'}
            </p>
          </div>

          {/* Duration */}
          {displayRecord.duration && displayRecord.duration > 0 && (
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium text-gray-900">
                {formatDuration(displayRecord.duration)}
              </p>
            </div>
          )}

          {/* Timestamp */}
          {displayRecord.timestamp && (
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium text-gray-900">
                {getISTDate(displayRecord.timestamp).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                })}
              </p>
            </div>
          )}

          {/* Location */}
          {displayRecord.location && (
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {displayRecord.location.latitude.toFixed(4)},{' '}
                {displayRecord.location.longitude.toFixed(4)}
              </p>
            </div>
          )}

          {/* Release Rights */}
          <div>
            <p className="text-sm text-gray-500">Release Rights</p>
            <p className="font-medium text-gray-900">
              {displayRecord.release_rights || 'N/A'}
            </p>
          </div>

          {/* SNR Frequency */}
          {displayRecord.snr_frequency > 0 && (
            <div>
              <p className="text-sm text-gray-500">SNR Frequency</p>
              <p className="font-medium text-gray-900">
                {displayRecord.snr_frequency.toFixed(2)} dB
              </p>
            </div>
          )}

          {/* Record ID */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Record ID</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {displayRecord.id}
            </p>
          </div>

          {/* File Hash */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">File Hash</p>
            <p className="font-mono text-sm text-gray-900 break-all">
              {displayRecord.file_hash}
            </p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium text-gray-900">
              {displayRecord.description || 'No description'}
            </p>
          </div>

          {/* Status */}
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                displayRecord.reviewed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {displayRecord.reviewed ? 'Reviewed' : 'Pending Review'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;
