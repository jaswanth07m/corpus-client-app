import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Tag,
  Play,
  FileText,
} from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatSizeMB, formatDuration, getISTDate } from '@/lib/utils';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ContributionItem {
  id: string;
  user_id?: string;
  size: number;
  category_id?: string;
  category_ids?: string[];
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
  media_type?: string;
}

const RecordDetails: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId]);

  // Fetch media URL for preview
  const fetchMediaUrl = async () => {
    if (!recordId || mediaUrl || !record) return;

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

  // Determine media type from record
  const getMediaType = () => {
    if (!record) return null;
    return record.media_type || 'text';
  };

  // Render media preview based on type
  const renderMediaPreview = () => {
    const mediaType = getMediaType();

    if (!mediaType) return null;

    switch (mediaType) {
      case 'image':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg max-h-[400px]">
            {mediaLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {mediaError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Image unavailable</p>
                </div>
              </div>
            )}
            {!mediaLoading && !mediaError && mediaUrl && (
              <img
                src={mediaUrl}
                alt={record?.title || 'Image'}
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
        );

      case 'video':
        return (
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg">
            {mediaLoading && (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {mediaError && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <Play className="w-12 h-12 mx-auto text-gray-400 mb-2" />
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
        );

      case 'audio':
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg p-6">
            {mediaLoading && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              </div>
            )}
            {mediaError && (
              <div className="flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <Play className="w-12 h-12 mx-auto text-gray-400 mb-2" />
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
        );

      case 'text':
        return (
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
                Text Document
              </p>
              {mediaUrl && (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Text
                </a>
              )}
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg p-6">
            <div className="flex flex-col items-center justify-center">
              <svg
                className="w-16 h-16 text-yellow-600 mb-4"
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
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Document
              </p>
              {mediaUrl && (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Open Document
                </a>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="rounded-xl overflow-hidden bg-gray-100 shadow-lg p-6">
            <div className="flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-500">No preview available</p>
            </div>
          </div>
        );
    }
  };

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

  if (!record) {
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

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Title and Status */}
        <div className="p-6 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {record.title || 'Untitled'}
              </h2>
              <p className="text-gray-600">
                {record.description || 'No description'}
              </p>
              {/* Record ID Badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-500">ID:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {record.id}
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                record.reviewed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {record.reviewed ? 'Reviewed' : 'Pending Review'}
            </span>
          </div>
        </div>

        {/* Media Preview */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Media Preview
          </h3>
          {renderMediaPreview()}
        </div>

        {/* IDs Section */}
        <div className="p-6 border-b bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Identification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record ID */}
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Record ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {record.id}
                </p>
              </div>
            </div>

            {/* User ID */}
            {record.user_id && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">User ID</p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {record.user_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Language</p>
              <p className="text-gray-900 capitalize">
                {record.language || 'N/A'}
              </p>
            </div>
          </div>

          {/* Creator */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Contributor</p>
              <p className="text-gray-900">{record.creator || 'N/A'}</p>
            </div>
          </div>

          {/* Size */}
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Size</p>
              <p className="text-gray-900">{formatSizeMB(record.size)}</p>
            </div>
          </div>

          {/* Duration */}
          {record.duration && record.duration > 0 && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="text-gray-900">
                  {formatDuration(record.duration)}
                </p>
              </div>
            </div>
          )}

          {/* Timestamp */}
          {record.timestamp && (
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-gray-900">
                  {getISTDate(record.timestamp).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Location */}
          {record.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-900">
                  {record.location.latitude.toFixed(4)},{' '}
                  {record.location.longitude.toFixed(4)}
                </p>
              </div>
            </div>
          )}

          {/* Release Rights */}
          <div className="flex items-start gap-3">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Release Rights</p>
              <p className="text-gray-900">{record.release_rights || 'N/A'}</p>
            </div>
          </div>

          {/* SNR Frequency */}
          {record.snr_frequency > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">SNR Frequency</p>
                <p className="text-gray-900">
                  {record.snr_frequency.toFixed(2)} dB
                </p>
              </div>
            </div>
          )}

          {/* File Hash */}
          <div className="flex items-start gap-3 md:col-span-2">
            <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">File Hash</p>
              <p className="font-mono text-sm text-gray-900 break-all">
                {record.file_hash}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;
