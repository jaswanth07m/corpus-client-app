import PeerReviewCard from '@/components/PeerReviewCard';
import { BACKEND_URL } from '@/lib/constants';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';

interface PeerReviewCardProps {
  user_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  dataUrl: string;
}

const PeerReview: React.FC = () => {
  const [recordIdList, setRecordIdList] = useState<PeerReviewCardProps[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  async function fetchMoreData() {
    const token = localStorage.getItem('token');

    try {
      const nextRecordResponse = await fetch(
        `${BACKEND_URL}/records/next-for-review?media_type=audio&media_type=video&media_type=image&proof_reading=false&limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (nextRecordResponse.status === 404) {
        setHasMore(false);
        return;
      }

      if (!nextRecordResponse.ok) {
        const errorData = await nextRecordResponse.json();
        throw new Error(errorData.message || 'Error in fetching');
      }

      const responseArray = await nextRecordResponse.json();

      if (!Array.isArray(responseArray) || responseArray.length === 0) {
        setHasMore(false);
        return;
      }

      for (const item of responseArray) {
        const { record_id } = item;
        try {
          const [recordDetailsResponse, recordUrlResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/records/${record_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${BACKEND_URL}/records/${record_id}/record-url`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (!recordDetailsResponse.ok || !recordUrlResponse.ok) {
            continue;
          }

          const recordDetails = await recordDetailsResponse
            .json()
            .catch(() => null);
          const urlData = await recordUrlResponse.json().catch(() => null);

          if (!recordDetails || !urlData) {
            continue;
          }

          const successfull: PeerReviewCardProps = {
            user_id: recordDetails.user_id,
            title: recordDetails.title,
            description: recordDetails.description,
            media_type: recordDetails.media_type,
            release_rights: recordDetails.release_rights,
            dataUrl: urlData.record_url,
          };

          setRecordIdList((prev) => [...prev, successfull]);

          console.log(recordDetails);
        } catch (err) {
          continue;
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('An Error Occurred', error);
      setError(error.message);
      setHasMore(false);
    }
  }

  useEffect(() => {
    fetchMoreData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div
        className={`gradient-purple text-white p-4 rounded-b-3xl shadow-xl transition-all duration-300 ${typeof window !== 'undefined' && isHeaderCollapsed && window.innerWidth < 768 ? 'pb-2' : ''}`}
      >
        {/* Main header content - hidden when collapsed on mobile */}
        <div
          className={`${typeof window !== 'undefined' && isHeaderCollapsed && window.innerWidth < 768 ? 'hidden' : ''} flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                window.location.href = '/annotations';
              }}
              className="text-white hover:bg-white/20 w-10 h-10 rounded-full p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Peer Review</h1>
              <p className="text-purple-100 text-sm">
                Review and rate your peer's uploads
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: Header toggle with chevrons - below page numbers */}
        <div className="flex justify-center items-center md:hidden">
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className="text-white flex items-center gap-1 mt-1"
          >
            {isHeaderCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="peer-container flex justify-center p-4">
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <InfiniteScroll
          dataLength={recordIdList.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.1s]"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            </div>
          }
        >
          {recordIdList.map((record, index) => (
            <PeerReviewCard
              user_id={record.user_id}
              title={record.title}
              description={record.description}
              media_type={record.media_type}
              release_rights={record.release_rights}
              dataUrl={record.dataUrl}
            />
          ))}
        </InfiniteScroll>
      </div>
    </div>
  );
};

export default PeerReview;
