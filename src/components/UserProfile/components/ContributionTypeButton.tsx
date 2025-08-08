import React from 'react';
import { MediaType } from '../types';
import { capitalize } from '../utils';

interface ContributionTypeButtonProps {
  type: MediaType;
  selectedMediaType: MediaType;
  setSelectedMediaType: (type: MediaType) => void;
}

export const ContributionTypeButton: React.FC<ContributionTypeButtonProps> = ({
  type,
  selectedMediaType,
  setSelectedMediaType,
}) => (
  <button
    key={type}
    onClick={() => setSelectedMediaType(type)}
    className={`px-4 py-2 rounded-lg font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400
      ${
        selectedMediaType === type
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50'
      }`}
  >
    {capitalize(type)}
  </button>
);
