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

import { useUserProfile } from './UserProfile/hooks/useUserProfile';
import { ContributionsList } from './UserProfile/components/ContributionsList';
import { ProfileDetail } from './UserProfile/components/ProfileDetail';
import { ContributionTypeButton } from './UserProfile/components/ContributionTypeButton';
import { MediaType } from './UserProfile/types';
import {
  formatDate,
  getInitials,
  maskEmail,
  maskPhone,
} from './UserProfile/utils';
interface UserProfileProps {
  onBack: () => void;
}

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
