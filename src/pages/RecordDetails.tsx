import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';
import {
  ContributionItem,
  RecordDetailView,
  MediaPreviewView,
} from '@/components/MediaDetailModal';

const RecordDetails: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const [record, setRecord] = useState<ContributionItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>('');

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
      {/* User Profile Button */}
      <Link
        to={`/profile/${record.user_id || record.user_name || record.username || ''}`}
        className="flex items-center gap-3 mb-6 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
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
            {record.user_name || record.username || record.user_id || 'unknown'}
          </p>
        </div>
      </Link>

      {/* Record Details */}
      <RecordDetailView item={record} token={token} />
    </div>
  );
};

export default RecordDetails;
