import React, { useState } from 'react';
import { toast } from 'sonner';
import { ContributionItem, MediaType, UserContributions } from '../types';
import { getAuthToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/constants';
import { ContributionItem as ContributionItemComponent } from './ContributionItem';

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: MediaType;
  onUpdate: () => void;
}

export const ContributionsList: React.FC<ContributionsListProps> = ({
  contributions,
  selectedMediaType,
}) => {
  if (!contributions) {
    return (
      <div className="text-center text-red-500 py-10">
        Error: Contribution data is missing.
      </div>
    );
  }

  const propertyKey = `${selectedMediaType}_contributions`;
  const items: ContributionItem[] = (contributions?.[
    propertyKey as keyof UserContributions
  ] ?? []) as ContributionItem[];

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No {selectedMediaType} contributions yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <ContributionItemComponent
          key={item.id}
          item={item}
          mediaType={selectedMediaType}
        />
      ))}
    </ul>
  );
};
