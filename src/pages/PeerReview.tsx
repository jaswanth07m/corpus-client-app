import PeerReviewCard from '@/components/PeerReviewCard';
import { BACKEND_URL } from '@/lib/constants';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LogOut,
  Search,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import BottomNav from '@/components/BottomNav';

interface PeerReviewCardProps {
  user_id: string;
  username?: string;
  record_id: string;
  title: string;
  description: string;
  media_type: string;
  release_rights: string;
  language: string;
  dataUrl: string;
}

const PeerReview: React.FC = () => {
  const numberOfRecordsFetched = 10;
  const numberOfRecordsRemoved = 5;

  const [recordIdList, setRecordIdList] = useState<PeerReviewCardProps[]>([]);
  const [allRecords, setAllRecords] = useState<PeerReviewCardProps[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'records' | 'users'>('records');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  async function fetchMoreData() {
    // Don't fetch more data if user is searching
    if (isSearching || isFetching || !hasMore) {
      return;
    }
    setIsFetching(true);
    console.count('fetchMoreData called');

    const token = localStorage.getItem('token');

    //setRecordIdList(prev => prev.slice(5));

    try {
      const nextRecordResponse = await fetch(
        `${BACKEND_URL}/records/next-for-review?media_type=audio&media_type=video&media_type=image&proof_reading=false&limit=${numberOfRecordsFetched}`,
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
            username:
              recordDetails.user_name ||
              recordDetails.username ||
              recordDetails.userName ||
              `user_${recordDetails.user_id}`,
            record_id: record_id,
            title: recordDetails.title,
            description: recordDetails.description,
            media_type: recordDetails.media_type,
            release_rights: recordDetails.release_rights,
            language: recordDetails.language,
            dataUrl: urlData.record_url,
          };

          // Only update lists if not searching
          if (!isSearching) {
            setRecordIdList((prev) => [...prev, successfull]);
          }
          setAllRecords((prev) => [...prev, successfull]);

          // console.log('Record details:', recordDetails);
          // console.log('Username:', successfull.username);
        } catch (err) {
          continue;
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('An Error Occurred', error);
      setError(error.message);
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }

  async function searchRecords(query: string) {
    const token = localStorage.getItem('token');

    setIsLoading(true); // Set loading state to true

    try {
      // Call the search API with the query and limit parameters - using records/search (BACKEND_URL already includes /api/v1)
      const searchResponse = await fetch(
        `${BACKEND_URL}/records/search?query=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.message || 'Error in search');
      }

      const responseArray = await searchResponse.json();

      if (!Array.isArray(responseArray) || responseArray.length === 0) {
        setRecordIdList([]);
        return;
      }

      // Transform the search results to match our PeerReviewCardProps structure
      const searchResults: PeerReviewCardProps[] = [];

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

          const searchResult: PeerReviewCardProps = {
            user_id: recordDetails.user_id,
            username:
              recordDetails.user_name ||
              recordDetails.username ||
              recordDetails.userName ||
              `user_${recordDetails.user_id}`,
            record_id: record_id,
            title: recordDetails.title,
            description: recordDetails.description,
            media_type: recordDetails.media_type,
            release_rights: recordDetails.release_rights,
            language: recordDetails.language,
            dataUrl: urlData.record_url,
          };

          searchResults.push(searchResult);
        } catch (err) {
          console.error('Error processing search result:', err);
          continue;
        }
      }

      setRecordIdList(searchResults);
      setAllRecords(searchResults); // Update all records with search results
    } catch (err) {
      const error = err as Error;
      console.error('Search Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  }

  async function searchUsers(query: string) {
    const token = localStorage.getItem('token');

    setIsLoading(true); // Set loading state to true

    try {
      // Call the user profile API with the user identifier - using /users/{user_identifier}/profile
      const userResponse = await fetch(
        `${BACKEND_URL}/users/${encodeURIComponent(query)}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'User not found');
      }

      // If user is found, redirect to their profile page
      window.location.href = `/profile/${encodeURIComponent(query)}`;
    } catch (err) {
      const error = err as Error;
      console.error('User search Error:', error);
      setError(error.message);
      setIsLoading(false); // Make sure to reset loading state on error
    }
  }

  useEffect(() => {
    fetchMoreData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      // Reset to default view when search is cleared
      setRecordIdList([]);
      setAllRecords([]);
      setIsSearching(false);
      setHasMore(true);
      setCurrentPage(0);
      setIsLoading(false); // Make sure loading is false when clearing search
      // Fetch initial records again
      await fetchMoreData();
    } else {
      setIsSearching(true);
      setHasMore(false); // Disable infinite scroll during search

      if (searchType === 'records') {
        await searchRecords(query);
      } else if (searchType === 'users') {
        await searchUsers(query);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen pb-20">
      {/* Professional Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Peer Review</h1>
              <p className="text-slate-600 text-sm">
                Review community contributions
              </p>
            </div>
          </div>
          {/* Search Toggle Button */}
          <button
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
            className={`p-2 rounded-lg transition-all duration-200 ${!isHeaderCollapsed ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600' : 'hover:bg-slate-100 text-slate-700'}`}
          >
            <Search className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar and Toggle Container - Collapsible */}
        {!isHeaderCollapsed && (
          <div className="max-w-7xl mx-auto mt-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    searchType === 'records'
                      ? 'Search by title, description ...'
                      : 'Search for users...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      await handleSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={async () => await handleSearch('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Record/User Toggle - appears beside search on desktop, below on mobile */}
              <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm w-full sm:w-auto">
                <button
                  onClick={() => setSearchType('records')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${
                    searchType === 'records'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Records
                </button>
                <button
                  onClick={() => setSearchType('users')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${
                    searchType === 'users'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>

            {/* Loading indicator when searching */}
            {isLoading && (
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full animate-pulse"
                    style={{ width: '100%' }}
                  ></div>
                </div>
                <p className="text-sm text-slate-600 mt-1 text-center">
                  {searchType === 'records'
                    ? 'Searching records...'
                    : 'Searching users...'}
                </p>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-end mt-2">
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Refresh Feed
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div
        id="peer-scroll-container"
        className="peer-container overflow-x-hidden flex justify-center py-4 bg-slate-50 flex-1 overflow-auto"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {recordIdList.length === 0 && isSearching ? (
          <div className="text-center py-12">
            <p className="text-slate-600 text-lg mb-4">
              No results found for "{searchQuery}"
            </p>
            <p className="text-slate-500 text-sm mb-6">
              The user might not be in the loaded records yet. Try clearing the
              search and scrolling to load more records.
            </p>
            <button
              onClick={() => {
                window.location.reload();
              }}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Refresh Feed
            </button>
          </div>
        ) : (
          <InfiniteScroll
            dataLength={recordIdList.length}
            next={fetchMoreData}
            scrollableTarget="peer-scroll-container"
            hasMore={hasMore && !isSearching} // Disable infinite scroll when searching
            loader={
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.1s]"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              </div>
            }
          >
            {recordIdList.map((record, index) => (
              <PeerReviewCard
                key={record.record_id}
                user_id={record.user_id}
                username={record.username}
                record_id={record.record_id}
                title={record.title}
                description={record.description}
                media_type={record.media_type}
                release_rights={record.release_rights}
                language={record.language}
                dataUrl={record.dataUrl}
              />
            ))}
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
};

export default PeerReview;
