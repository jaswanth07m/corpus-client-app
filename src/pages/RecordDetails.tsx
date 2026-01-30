import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Loader2, Copy, Check } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import { toast } from 'sonner';
import {
  ContributionItem,
  RecordDetailView,
  MediaDetailModal,
} from '@/components/MediaDetailModal';

const RecordDetails: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Fetch media preview URL when record is loaded

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!recordId) return;

      setLoading(true);
      setError(null);

      try {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          throw new Error('Authentication required');
        }
        setToken(storedToken);

        const response = await fetch(`${BACKEND_URL}/records/${recordId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecord(data);

        // Check if current user owns this record
        const currentUserId = localStorage.getItem('user_id');
        setIsOwnProfile(currentUserId === data.user_id);

        // Fetch media preview URL for audio, video, document types
        if (
          data.media_type &&
          ['audio', 'video', 'document'].includes(data.media_type)
        ) {
          try {
            const mediaResponse = await fetch(
              `${BACKEND_URL}/records/${recordId}/record-url?expires_minutes=60`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${storedToken}`,
                  'Content-Type': 'application/json',
                },
              },
            );
            if (mediaResponse.ok) {
              const mediaData = await mediaResponse.json();
              if (mediaData.record_url) {
                setPreviewUrl(mediaData.record_url);
              }
            }
          } catch (mediaErr) {
            console.error('Error fetching media URL:', mediaErr);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId]);

  // Copy record page URL to clipboard
  const copyRecordUrl = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-red-600 mb-4">Error: {error}</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-gray-600 mb-4">Record not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* User Profile and Share Button Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* User Profile Button */}
        <Link
          to={`/profile/${record.user_id || record.user_name || record.username || ''}`}
          className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex-1"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {record.creator ||
                record.user_name ||
                record.username ||
                'Unknown User'}
            </p>
            <p className="text-sm text-gray-500">
              @
              {record.user_name ||
                record.username ||
                record.user_id ||
                'unknown'}
            </p>
          </div>
        </Link>

        {/* Share Button */}
        <button
          onClick={copyRecordUrl}
          className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:brightness-110"
        >
          {copied ? (
            <Check className="w-5 h-5" />
          ) : (
            <Copy className="w-5 h-5" />
          )}
          <span className="font-medium">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>

      {/* Media Section with Play Button */}
      {record.media_type && record.media_type !== 'text' && (
        <div className="mb-6">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-lg relative">
            {previewUrl ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <video
                  src={previewUrl}
                  className="max-w-full max-h-full"
                  controls
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center p-4">
                  <p className="text-gray-500 mb-4">Click to load and play</p>
                  <button
                    onClick={() => setShowMediaModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Play{' '}
                    {record.media_type.charAt(0).toUpperCase() +
                      record.media_type.slice(1)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Details */}
      <RecordDetailView item={record} token={token} />

      {/* Media Modal */}
      {record.media_type && record.media_type !== 'text' && (
        <MediaDetailModal
          item={record}
          mediaType={
            record.media_type as
              | 'text'
              | 'audio'
              | 'video'
              | 'image'
              | 'document'
          }
          previewUrl={previewUrl}
          token={token}
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          isOwnProfile={isOwnProfile}
        />
      )}
    </div>
  );
};

export default RecordDetails;
