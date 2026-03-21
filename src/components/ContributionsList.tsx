import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaGridItem } from './MediaGridItem';

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

interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
    document: number;
  };
  audioContributions: ContributionItem[];
  videoContributions: ContributionItem[];
  textContributions: ContributionItem[];
  imageContributions: ContributionItem[];
  documentContributions: ContributionItem[];
  audioDuration: number;
  videoDuration: number;
}

export type { UserContributions, ContributionItem };

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: 'text' | 'audio' | 'video' | 'image' | 'document' | null;
  token: string;
  isOwnProfile: boolean;
}

export type { ContributionsListProps };

export const ContributionsList: React.FC<ContributionsListProps> = ({
  contributions,
  selectedMediaType,
  token,
  isOwnProfile,
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  let items: ContributionItem[] = [];
  if (!contributions || !selectedMediaType) return null;

  if (selectedMediaType === 'text') items = contributions.textContributions;
  if (selectedMediaType === 'audio') items = contributions.audioContributions;
  if (selectedMediaType === 'video') items = contributions.videoContributions;
  if (selectedMediaType === 'image') items = contributions.imageContributions;
  if (selectedMediaType === 'document')
    items = contributions.documentContributions;

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 text-lg font-medium">
        No{' '}
        {selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)}{' '}
        {t('stats.contributionsYet')}
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  // Show grid layout for all media types using the consolidated MediaGridItem
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {currentItems.map((item) => (
          <MediaGridItem
            key={item.id}
            item={item}
            mediaType={selectedMediaType}
            token={token}
            isOwnProfile={isOwnProfile}
          />
        ))}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // If total pages is less than or equal to max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and adjacent pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Somewhere in the middle
        pages.push(1);
        pages.push('ellipsis');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-wrap items-center justify-center mt-4 sm:mt-6 gap-1 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Prev
      </button>

      {pageNumbers.map((page, index) => (
        <React.Fragment key={`${index}-${page}`}>
          {page === 'ellipsis' ? (
            <span className="px-2 py-1.5 sm:px-3 sm:py-2 text-gray-500 text-sm">
              ...
            </span>
          ) : (
            <button
              onClick={() => onPageChange(page as number)}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${
          currentPage === totalPages
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
        }`}
      >
        Next
      </button>
    </div>
  );
};
