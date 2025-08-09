import React from 'react';
import { ContributionItem as ContributionItemType, MediaType } from '../types';
import { formatSizeMB, formatDuration } from '@/lib/utils';
import { capitalize } from '../utils';

interface ContributionItemProps {
  item: ContributionItemType;
  mediaType: MediaType;
  onEdit: (item: ContributionItemType) => void;
}

export const ContributionItem: React.FC<ContributionItemProps> = ({
  item,
  mediaType,
}) => {
  const typeColorClasses = {
    text: 'bg-blue-100 text-blue-700',
    audio: 'bg-green-100 text-green-700',
    video: 'bg-purple-100 text-purple-700',
    image: 'bg-orange-100 text-orange-700',
  };

  return (
    <li
      className={`
    flex flex-row items-center 
    py-4 px-2 rounded-lg transition
  `}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${typeColorClasses[mediaType]}`}
          >
            {capitalize(mediaType)}
          </span>
          <span className="ml-2 text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            {item.title || (
              <span className="text-gray-400 italic">Untitled</span>
            )}
          </span>
          {item.reviewed && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-bold uppercase tracking-wide">
              Reviewed
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
          {item.timestamp && (
            <span className="font-mono text-xs">
              📅 {new Date(item.timestamp).toLocaleDateString()}
            </span>
          )}
          {item.location && (
            <span className="font-mono text-xs">
              📍 {item.location.latitude.toFixed(2)},{' '}
              {item.location.longitude.toFixed(2)}
            </span>
          )}
          <span className="font-mono text-xs">
            💾 {item.size ? formatSizeMB(item.size) : '-'}
          </span>
          {(mediaType === 'audio' || mediaType === 'video') && (
            <span className="font-mono text-xs">
              ⏱️ {item.duration ? formatDuration(item.duration) : '-'}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};
