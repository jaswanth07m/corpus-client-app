import PeerReviewCard from '@/components/PeerReviewCard';
import UserSearchResults from '@/components/UserSearchResults';
import { BACKEND_URL } from '@/lib/constants';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Search } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { NetworkStrengthIndicator } from '@/components/NetworkStrengthIndicator';

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

interface ReviewPageBaseProps {
  title: string;
  description: string;
  mediaTypes: string[];
  proofReading?: boolean;
}

const ReviewPageBase: React.FC<ReviewPageBaseProps> = ({
  title,
  description,
  mediaTypes,
  proofReading = false,
}) => {
  const { t } = useTranslation();
  const numberOfRecordsFetched = 10;

  const [recordIdList, setRecordIdList] = useState<PeerReviewCardProps[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [bufferIds, setBufferIds] = useState<
    (string | { record_id: string })[]
  >([]);
  const [nextIndex, setNextIndex] = useState(0);

  const [error, setError] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [prevSearchQuery, setPrevSearchQuery] = useState('');
  const [inSearch, setInSearch] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'records' | 'users'>('records');
  const [isFetching, setIsFetching] = useState(false);

  // State for user search results
  const [userSearchResults, setUserSearchResults] = useState<
    { username: string }[]
  >([]);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  const fetchMoreData = useCallback(async () => {
    if (isFetching || !hasMore) return;

    setIsFetching(true);
    const token = localStorage.getItem('token');

    try {
      const nextRecordResponse = await fetch(
        `${BACKEND_URL}/records/for-review`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filters: {
              media_type: mediaTypes,
            },
            limit: numberOfRecordsFetched,
          }),
        },
      );

      if (!nextRecordResponse.ok) {
        const errorData = await nextRecordResponse.json();
        throw new Error(errorData.message || 'Error in fetching');
      }

      const responseBody = await nextRecordResponse.json();
      const responseArray = responseBody.record_ids;

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

          setRecordIdList((prev) => [...prev, successfull]);
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
  }, [isFetching, hasMore, mediaTypes, proofReading, numberOfRecordsFetched]);

  async function searchRecords(query: string) {
    const token = localStorage.getItem('token');
    setIsLoading(true);

    try {
      let currentBuffer = bufferIds;
      if (query != prevSearchQuery) {
        const mediaTypesQuery = mediaTypes
          .map((type) => `media_type=${type}`)
          .join('&');
        const searchResponse = await fetch(
          `${BACKEND_URL}/records/search?query=${encodeURIComponent(query)}&limit=50&${mediaTypesQuery}`,
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

        const newIds = await searchResponse.json();
        currentBuffer = newIds;

        setBufferIds(newIds);
        setRecordIdList([]);
        setNextIndex(0);
      }
      const start = query !== prevSearchQuery ? 0 : nextIndex;
      const responseArray = currentBuffer.slice(start, start + 10);

      for (const item of responseArray) {
        const record_id = typeof item === 'string' ? item : item.record_id;
        const isDuplicate = recordIdList.some((r) => r.record_id === record_id);
        if (isDuplicate) continue;

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

          if (!recordDetails || !urlData) continue;

          // Filter by media type if specialized
          if (
            mediaTypes.length > 0 &&
            !mediaTypes.includes(recordDetails.media_type)
          ) {
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
          setRecordIdList((prev) => [...prev, searchResult]);
        } catch (err) {
          continue;
        }
      }
      setNextIndex(start + 10);
      setPrevSearchQuery(query);
      setHasMore(start + 10 < currentBuffer.length);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function searchUsers(query: string) {
    const token = localStorage.getItem('token');
    setIsLoading(true);
    setUserSearchError(null);

    try {
      const userResponse = await fetch(
        `${BACKEND_URL}/users/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Error searching users');
      }

      const users = await userResponse.json();
      setUserSearchResults(users);
    } catch (err) {
      setUserSearchError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSelectUser = (username: string) => {
    window.location.href = `/profile/${encodeURIComponent(username)}`;
  };

  useEffect(() => {
    fetchMoreData();
  }, [fetchMoreData]);

  useEffect(() => {
    if (searchType === 'users' && inSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [searchType, inSearch]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setRecordIdList([]);
      setUserSearchResults([]);
      setInSearch(false);
      setIsSearching(false);
      setHasMore(true);
      setIsLoading(false);
      await fetchMoreData();
    } else {
      setInSearch(true);
      setIsSearching(true);
      setHasMore(false);
      if (searchType === 'records') {
        await searchRecords(query);
      } else if (searchType === 'users') {
        await searchUsers(query);
      }
    }
  };

  const handleInfiniteScroll = () => {
    if (!isFetching && !isLoading) {
      if (inSearch && searchType !== 'users') {
        handleSearch(searchQuery);
      } else if (!inSearch) {
        fetchMoreData();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen pb-12 bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.location.href = window.location.pathname.includes(
                  '/tools/',
                )
                  ? '/tools'
                  : '/';
              }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="text-slate-600 text-sm">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className={`p-2 rounded-lg transition-all duration-200 ${!isHeaderCollapsed ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600' : 'hover:bg-slate-100 text-slate-700'}`}
            >
              <Search className="w-6 h-6" />
            </button>
            <NetworkStrengthIndicator />
          </div>
        </div>

        {!isHeaderCollapsed && (
          <div className="max-w-7xl mx-auto mt-3">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    searchType === 'records'
                      ? t('common.searchByTitleDescription')
                      : t('nav.searchUsers')
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') await handleSearch(searchQuery);
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

              <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm w-full sm:w-auto">
                <button
                  onClick={() => setSearchType('records')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${searchType === 'records' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Records
                </button>
                <button
                  onClick={() => setSearchType('users')}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${searchType === 'users' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                >
                  Users
                </button>
              </div>
            </div>

            {isLoading && (
              <div className="mt-3">
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full animate-pulse"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            )}

            {isSearching && (
              <div className="flex items-center justify-end mt-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {t('common.refreshFeed')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        id="review-scroll-container"
        className="flex-1 overflow-auto overflow-x-hidden flex justify-center py-4"
      >
        <div className="w-full max-w-4xl px-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {searchType === 'users' && inSearch && (
            <UserSearchResults
              users={userSearchResults}
              onSelectUser={handleSelectUser}
              isLoading={isLoading}
              error={userSearchError || undefined}
              isVisible={true}
              onClose={() => {
                setInSearch(false);
                setUserSearchResults([]);
              }}
            />
          )}

          {recordIdList.length === 0 && inSearch && searchType === 'records' ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg mb-4">
                {t('common.noResultsFoundFor')} "{searchQuery}"
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {t('common.refreshFeed')}
              </button>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={recordIdList.length}
              next={handleInfiniteScroll}
              scrollableTarget="review-scroll-container"
              hasMore={hasMore || !isFetching || !isLoading}
              loader={
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                </div>
              }
            >
              <div className="flex flex-col items-center">
                {recordIdList.map((record) => (
                  <PeerReviewCard key={record.record_id} {...record} />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewPageBase;
