import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Clock, MapPin, User, Tag } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { formatSizeMB, formatDuration, getISTDate } from '@/lib/utils';
import { ContributionItem } from '@/components/MediaDetailModal';

const RecordDetails: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
