import React from 'react';

interface ProfileDetailProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  hasButton?: boolean;
  buttonAction?: () => void;
  buttonTitle?: string;
  buttonIcon?: React.ReactNode;
}

export const ProfileDetail: React.FC<ProfileDetailProps> = ({
  icon,
  title,
  value,
  hasButton,
  buttonAction,
  buttonTitle,
  buttonIcon,
}) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center space-x-3">
      {icon}
      <div>
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-base text-gray-800 font-mono">
          {value || 'Not Provided'}
        </p>
      </div>
    </div>
    {hasButton && (
      <button
        onClick={buttonAction}
        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        title={buttonTitle}
      >
        {buttonIcon}
      </button>
    )}
  </div>
);
