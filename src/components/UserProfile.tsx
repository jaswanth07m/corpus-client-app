import React, { useState, useEffect, useCallback } from 'react';

import {
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Activity,
  TrendingUp,
  Award,
  ArrowLeft,
} from 'lucide-react';

import { getAuthToken, decodeUserIdFromToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/constants';
import { formatSizeMB, formatDuration } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone: string;
  name: string;
  gender?: string;
  date_of_birth?: string;
  place?: string;
  is_active: boolean;
  has_given_consent: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface DailyStats {
  uploads_today: number;
  total_uploads: number;
  last_upload_date: string;
  streak_days: number;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface ContributionItem {
  id: string;
  size: number;
  category_id: string;
  reviewed: boolean;
  title: string;
  duration?: number;
  timestamp?: string;
  location?: Coordinates;
}

interface UserContributions {
  totalContributions: number;
  contributionsByType: {
    text: number;
    audio: number;
    image: number;
    video: number;
  };
  audioContributions: ContributionItem[];
  videoContributions: ContributionItem[];
  textContributions: ContributionItem[];
  imageContributions: ContributionItem[];
  audioDuration: number;
  videoDuration: number;
}

interface ContributionItemProps {
  item: ContributionItem;
  mediaType: MediaType;
}

type MediaType = 'text' | 'audio' | 'video' | 'image';

interface UserProfileProps {
  onBack: () => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

const maskEmail = (email?: string) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!username || !domain) return email;
  return `${username.substring(0, 2)}${'*'.repeat(Math.max(0, username.length - 2))}@${domain}`;
};

const maskPhone = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return `**-****-${cleaned.substring(cleaned.length - 4)}`;
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const capitalize = (str: string) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [contributions, setContributions] = useState<UserContributions | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    const currentUserId = userId || decodeUserIdFromToken(token);
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    const userProfileUrl = `${BACKEND_URL}/users/${currentUserId}`;

    const profileRes = await fetch(userProfileUrl, { headers });

    const [statsRes, contributionsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/auth/me`, { headers }),
      fetch(`${BACKEND_URL}/users/${currentUserId}/contributions`, { headers }),
    ]);

    const profileData = await profileRes.json();
    const statsData = await statsRes.json();
    const contributionsData = await contributionsRes.json();

    setProfile(profileData);
    setDailyStats(statsData.data);
    setContributions(contributionsData);

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    profile,
    dailyStats,
    contributions,
    loading,
    error,
    refetch: fetchAllData,
  };
};

interface ContributionTypeButtonProps {
  type: MediaType;
  selectedMediaType: MediaType;
  setSelectedMediaType: (type: MediaType) => void;
}

const ContributionTypeButton: React.FC<ContributionTypeButtonProps> = ({
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

interface ContributionsListProps {
  contributions: UserContributions | null;
  selectedMediaType: MediaType;
  onUpdate: () => void;
}

const ContributionsList: React.FC<ContributionsListProps> = ({
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
        <ContributionItem
          key={item.id}
          item={item}
          mediaType={selectedMediaType}
        />
      ))}
    </ul>
  );
};

const ContributionItem: React.FC<ContributionItemProps> = ({
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

interface ProfileDetailProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  hasButton?: boolean;
  buttonAction?: () => void;
  buttonTitle?: string;
  buttonIcon?: React.ReactNode;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({
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

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const {
    profile: currentUser,
    contributions,
    loading,
    error,
    refetch,
  } = useUserProfile();
  const [isEmailRevealed, setIsEmailRevealed] = useState(false);
  const [isPhoneRevealed, setIsPhoneRevealed] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType>('text');

  console.log('Current User Data at Render:', currentUser);

  const handleExport = () => {
    try {
      const exportData = {
        profile: currentUser,
        contributions: contributions,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || 'Unknown User',
      };

      const fileData = JSON.stringify(exportData, null, 2);

      const blob = new Blob([fileData], { type: 'application/json' });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `profile-data-${
        currentUser?.name?.replace(/\s+/g, '-') || 'user'
      }-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Profile data exported successfully');
    } catch (err) {
      console.error('💥 Export failed:', err);
      alert('Failed to export profile data');
    }
  };

  const handleExportCSV = () => {
    try {
      const csvData = [
        ['Field', 'Value'],
        ['Name', currentUser?.name || ''],
        ['Email', currentUser?.email || ''],
        ['Phone', currentUser?.phone || ''],
        ['Gender', currentUser?.gender || ''],
        ['Date of Birth', currentUser?.date_of_birth || ''],
        ['Place', currentUser?.place || ''],
        ['Status', currentUser?.is_active ? 'Active' : 'Inactive'],
        ['Consent Given', currentUser?.has_given_consent ? 'Yes' : 'No'],
        ['Member Since', formatDate(currentUser?.created_at || '')],
        ['Last Login', formatDate(currentUser?.last_login_at || '')],
        ['Text Contributions', contributions?.contributionsByType?.text || 0],
        ['Audio Contributions', contributions?.contributionsByType?.audio || 0],
        ['Image Contributions', contributions?.contributionsByType?.image || 0],
        ['Video Contributions', contributions?.contributionsByType?.video || 0],
        ['Total Contributions', contributions?.totalContributions || 0],
      ];

      const csvString = csvData
        .map((row) => row.map((field) => `"${field}"`).join(','))
        .join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `profile-data-${
        currentUser?.name?.replace(/\s+/g, '-') || 'user'
      }-${new Date().toISOString().split('T')[0]}.csv`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Profile data exported as CSV successfully');
    } catch (err) {
      console.error('💥 CSV export failed:', err);
      alert('Failed to export profile data as CSV');
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 font-semibold mb-4">{error}</div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">No user data could be loaded.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Back"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-semibold">
                {getInitials(currentUser.name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentUser.name}
                </h1>
                {/* THE FIX: Your log confirmed 'id' exists, so this is correct. */}
                <p className="text-gray-600">@{currentUser.id}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refetch}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileDetail
              icon={<Mail size={18} />}
              title="Email"
              value={
                isEmailRevealed
                  ? currentUser.email
                  : maskEmail(currentUser.email)
              }
              hasButton
              buttonAction={() => setIsEmailRevealed(!isEmailRevealed)}
              buttonIcon={
                isEmailRevealed ? <EyeOff size={18} /> : <Eye size={18} />
              }
            />
            <ProfileDetail
              icon={<Phone size={18} />}
              title="Phone"
              value={
                isPhoneRevealed
                  ? currentUser.phone
                  : maskPhone(currentUser.phone)
              }
              hasButton
              buttonAction={() => setIsPhoneRevealed(!isPhoneRevealed)}
              buttonIcon={
                isPhoneRevealed ? <EyeOff size={18} /> : <Eye size={18} />
              }
            />
            {currentUser.gender && (
              <ProfileDetail
                icon={<User size={18} />}
                title="Gender"
                value={currentUser.gender}
              />
            )}
            {currentUser.date_of_birth && (
              <ProfileDetail
                icon={<Calendar size={18} />}
                title="Date of Birth"
                value={formatDate(currentUser.date_of_birth)}
              />
            )}
            {currentUser.place && (
              <ProfileDetail
                icon={<MapPin size={18} />}
                title="Location"
                value={currentUser.place}
              />
            )}
          </div>
        </div>

        {/* Contributions Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            My Contributions
          </h2>
          {loading ? (
            <div className="text-center py-10">Loading contributions...</div>
          ) : contributions ? (
            <>
              <div className="flex justify-center gap-2 md:gap-4 my-4 border-b pb-4">
                {(['text', 'audio', 'video', 'image'] as MediaType[]).map(
                  (type) => (
                    <ContributionTypeButton
                      key={type}
                      type={type}
                      selectedMediaType={selectedMediaType}
                      setSelectedMediaType={setSelectedMediaType}
                    />
                  ),
                )}
              </div>
              <ContributionsList
                contributions={contributions}
                selectedMediaType={selectedMediaType}
                onUpdate={refetch}
              />
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">
              Could not load contribution data for this user.
            </div>
          )}
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Member Since</span>
              <span className="text-sm font-medium text-gray-900">
                {currentUser.created_at
                  ? formatDate(currentUser.created_at)
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {currentUser.updated_at
                  ? formatDate(currentUser.updated_at)
                  : 'NA'}
              </span>
            </div>
            {currentUser.last_login_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Login</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(currentUser.last_login_at)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Consent Given</span>
              <span
                className={`text-sm font-medium ${
                  currentUser.has_given_consent
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {currentUser.has_given_consent ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
        {/* Export Section */}
        <div className="flex space-x-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            disabled={!currentUser}
          >
            <Download size={16} />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            disabled={!currentUser}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
