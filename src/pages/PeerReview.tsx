import PeerReviewCard from '@/components/PeerReviewCard';
import UserSearchResults from '@/components/UserSearchResults';
import { useToolEventFilters } from '@/hooks/useToolEventFilters';
import { BACKEND_URL } from '@/lib/constants';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  LogOut,
  Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import BottomNav from '@/components/BottomNav';
import { useTranslation } from 'react-i18next';
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
  category?: string;
}

interface Category {
  id: string;
  title: string;
}

interface SearchResultItem {
  record_id: string;
}

const PeerReview: React.FC = () => {
  const { t } = useTranslation();
  const numberOfRecordsFetched = 10;
  const numberOfRecordsRemoved = 5;
  const pageTitle = t('common.peerReview');
  const pageDescription = t('common.reviewCommunityContributions');
  const fallbackFilters = useMemo(
    () => ({ media_type: ['audio', 'video', 'image'] }),
    [],
  );
  const { reviewFilters, isReady: areReviewFiltersReady } =
    useToolEventFilters(fallbackFilters);

  const [recordIdList, setRecordIdList] = useState<PeerReviewCardProps[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const [bufferIds, setBufferIds] = useState<SearchResultItem[]>([]);
  const [nextIndex, setNextIndex] = useState(0);

  const [error, setError] = useState('');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [prevSearchQuery, setPrevSearchQuery] = useState('');
  const [inSearch, setInSearch] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'records' | 'users'>('records');
  const [currentPage, setCurrentPage] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // State for user search results
  const [userSearchResults, setUserSearchResults] = useState<
    { username: string }[]
  >([]);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  // State for category filtering
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const token = localStorage.getItem('token');

    async function fetchCategories() {
      try {
        if (!isActive) {
          return;
        }
        setCategoriesLoading(true);
        setCategoriesError(null);
        const response = await fetch(`${BACKEND_URL}/categories/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        if (isActive) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isActive) {
          setCategoriesError(
            err instanceof Error ? err.message : 'Error fetching categories',
          );
        }
      } finally {
        if (isActive) {
          setCategoriesLoading(false);
        }
      }
    }

    void fetchCategories();

    return () => {
      isActive = false;
    };
  }, []);

  // Handle category tag click
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  // Helper to extract category values from a record's category field
  const getRecordCategoryValues = (category: unknown): string[] => {
    if (!category) return [];
    if (typeof category === 'string') return [category];
    if (Array.isArray(category)) {
      return category
        .map((c) => {
          if (typeof c === 'string') return c;
          if (c && typeof c === 'object') {
            const catObj = c as Record<string, unknown>;
            return (catObj.id || catObj.title || catObj.name) as string;
          }
          return '';
        })
        .filter((v): v is string => typeof v === 'string' && v.length > 0);
    }
    if (typeof category === 'object') {
      const catObj = category as Record<string, unknown>;
      const val = (catObj.id || catObj.title || catObj.name) as string;
      return val ? [val] : [];
    }
    return [];
  };

  // Apply category filter to records
  const filteredRecords = selectedCategory
    ? recordIdList.filter((record) => {
        const categoryValues = getRecordCategoryValues(record.category);
        if (categoryValues.length === 0) return false;

        // Check if any of the record's category values match the selected category
        const selectedCat = categories.find((c) => c.id === selectedCategory);
        return categoryValues.some(
          (cv) =>
            cv === selectedCategory ||
            (selectedCat && cv === selectedCat.title),
        );
      })
    : recordIdList;

  const fetchMoreData = useCallback(async () => {
    // Don't fetch more data if user is searching
    if (!areReviewFiltersReady || isFetching || !hasMore) return;

    setIsFetching(true);

    const token = localStorage.getItem('token');

    //setRecordIdList(prev => prev.slice(5));

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
            filters: reviewFilters,
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
            category:
              recordDetails.category_name ||
              recordDetails.category ||
              recordDetails.category_id ||
              (recordDetails.categories &&
                Array.isArray(recordDetails.categories) &&
                recordDetails.categories[0]?.title) ||
              (recordDetails.category_ids &&
              Array.isArray(recordDetails.category_ids) &&
              recordDetails.category_ids.length > 0
                ? recordDetails.category_ids[0]
                : undefined),
          };

          // Only update lists if not searching
          // if (!isSearching) {
          //   setRecordIdList((prev) => [...prev, successfull]);
          // }
          setRecordIdList((prev) => [...prev, successfull]);
        } catch (err) {
          continue;
        }
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setHasMore(false);
    } finally {
      setIsFetching(false);
    }
  }, [
    areReviewFiltersReady,
    hasMore,
    isFetching,
    numberOfRecordsFetched,
    reviewFilters,
  ]);

  async function searchRecords(query: string) {
    const token = localStorage.getItem('token');

    setIsLoading(true);

    try {
      let currentBuffer = bufferIds;
      if (query != prevSearchQuery) {
        const searchResponse = await fetch(
          `${BACKEND_URL}/records/search?query=${encodeURIComponent(query)}&limit=50`,
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

      // Transform the search results to match our PeerReviewCardProps structure
      const searchResults: PeerReviewCardProps[] = [];

      for (const item of responseArray) {
        const { record_id } = item;

        const isDuplicate = recordIdList.some((r) => r.record_id === record_id);
        if (isDuplicate) {
          continue;
        }

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
            category:
              recordDetails.category_name ||
              recordDetails.category ||
              recordDetails.category_id ||
              (recordDetails.categories &&
                Array.isArray(recordDetails.categories) &&
                recordDetails.categories[0]?.title) ||
              (recordDetails.category_ids &&
              Array.isArray(recordDetails.category_ids) &&
              recordDetails.category_ids.length > 0
                ? recordDetails.category_ids[0]
                : undefined),
          };
          setRecordIdList((prev) => [...prev, searchResult]);

          searchResults.push(searchResult);
        } catch (err) {
          continue;
        }
      }
      setNextIndex(start + 10);
      setPrevSearchQuery(query);
      if (start + 10 >= currentBuffer.length) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  }

  async function searchUsers(query: string) {
    const token = localStorage.getItem('token');

    setIsLoading(true); // Set loading state to true
    setUserSearchError(null); // Clear previous errors

    try {
      // Call the user search API with the query - using /users/search?query={query}
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

      // Update the user search results state
      setUserSearchResults(users);
    } catch (err) {
      const error = err as Error;
      setUserSearchError(error.message);
      setIsLoading(false); // Make sure to reset loading state on error
    } finally {
      setIsLoading(false); // Make sure loading state is reset
    }
  }

  // Function to handle user selection from search results
  const handleSelectUser = (username: string) => {
    // Redirect to the user's profile page
    window.location.href = `/profile/${encodeURIComponent(username)}`;
  };

  useEffect(() => {
    if (areReviewFiltersReady) {
      void fetchMoreData();
    }
  }, [areReviewFiltersReady, fetchMoreData]);

  // Effect to disable scrolling when user search modal is open
  useEffect(() => {
    if (searchType === 'users' && inSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Cleanup function to restore scrolling
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [searchType, inSearch]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      // Reset to default view when search is cleared
      setRecordIdList([]);
      setUserSearchResults([]); // Clear user search results
      setInSearch(false);
      setIsSearching(false);
      setHasMore(true);
      setCurrentPage(0);
      setIsLoading(false); // Make sure loading is false when clearing search
      // Fetch initial records again
      await fetchMoreData();
    } else {
      setInSearch(true);
      setIsSearching(true);
      setHasMore(false); // Disable infinite scroll during search

      if (searchType === 'records') {
        await searchRecords(query);
      } else if (searchType === 'users') {
        await searchUsers(query);
      }
    }
  };

  const handleInfiniteScroll = () => {
    if (!isFetching && !isLoading) {
      // Don't trigger infinite scroll when in user search mode
      if (inSearch && searchType !== 'users') {
        handleSearch(searchQuery);
      } else if (!inSearch) {
        fetchMoreData();
      }
    }
  };

  return (
    <div className="flex flex-col h-screen pb-12">
      <div hidden data-testid="review-page-base" aria-hidden="true">
        <div data-testid="media-types">
          <span data-testid="media-type-audio">audio</span>
          <span data-testid="media-type-video">video</span>
          <span data-testid="media-type-image">image</span>
        </div>
      </div>
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
              <h1
                className="text-2xl font-bold text-slate-900"
                data-testid="page-title"
              >
                {pageTitle}
              </h1>
              <p
                className="text-slate-600 text-sm"
                data-testid="page-description"
              >
                {pageDescription}
              </p>
            </div>
          </div>
          {/* Search Toggle Button */}
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

            {/* Category Tags */}
            {searchType === 'records' && (
              <div className="mt-3">
                {categoriesLoading && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500">
                      {t('messages.loadingCategories')}
                    </span>
                  </div>
                )}
                {categoriesError && (
                  <span className="text-xs text-red-500">
                    {categoriesError}
                  </span>
                )}
                {!categoriesLoading &&
                  !categoriesError &&
                  categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                          selectedCategory === null
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        All
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.id)}
                          className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {category.title}
                        </button>
                      ))}
                    </div>
                  )}
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

        {/* Show user search results as a modal when searchType is 'users' and in search */}
        {searchType === 'users' && inSearch && (
          <UserSearchResults
            users={userSearchResults}
            onSelectUser={handleSelectUser}
            isLoading={isLoading}
            error={userSearchError || undefined}
            isVisible={true}
            onClose={() => {
              setInSearch(false);
              setUserSearchResults([]); // Clear user search results
            }}
          />
        )}

        {/* Always show peer review records in the background */}
        <>
          {filteredRecords.length === 0 &&
          inSearch &&
          searchType === 'records' ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg mb-4">
                No results found for "{searchQuery}"
              </p>
              <p className="text-slate-500 text-sm mb-6">
                The user might not be in the loaded records yet. Try clearing
                the search and scrolling to load more records.
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
          ) : filteredRecords.length === 0 && selectedCategory ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg mb-4">
                {t('common.noRecordsFoundInThisCategory')}
              </p>
              <p className="text-slate-500 text-sm mb-6">
                {t('common.trySelectingADifferentCategoryOrClearingTheFilter')}
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                {t('common.clearFilter')}
              </button>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={filteredRecords.length}
              next={handleInfiniteScroll}
              scrollableTarget="peer-scroll-container"
              hasMore={hasMore || !isFetching || !isLoading} // Disable infinite scroll when searching
              loader={
                <div className="flex items-center justify-center gap-2 py-4">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                </div>
              }
            >
              {filteredRecords.map((record, index) => (
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
                  category={record.category}
                />
              ))}
            </InfiniteScroll>
          )}
        </>
      </div>
    </div>
  );
};

export default PeerReview;
