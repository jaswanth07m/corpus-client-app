import React from 'react';
import {
  Activity,
  TrendingUp,
  Award,
  Calendar,
  BarChart,
  Zap,
  Globe,
} from 'lucide-react';
import { formatModernTime, formatDuration } from '@/lib/utils';

interface DailyStats {
  uploads_today: number;
  total_uploads: number;
  last_upload_date: string;
  streak_days: number;
}

interface ContributionItem {
  id: string;
  size: number;
  category_id: string;
  reviewed: boolean;
  title: string;
  description: string;
  duration?: number;
  timestamp?: string;
  location?: { latitude: number; longitude: number };
  release_rights: string;
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

interface ContributionDashboardProps {
  dailyStats: DailyStats | null;
  contributions: UserContributions | null;
  loading: boolean;
}

const ContributionDashboard: React.FC<ContributionDashboardProps> = ({
  dailyStats,
  contributions,
  loading,
}) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading contributions dashboard...</p>
      </div>
    );
  }

  if (!dailyStats && !contributions) {
    return (
      <div className="text-center text-gray-500 py-8">
        No contribution data available.
      </div>
    );
  }

  const getLanguageContributions = () => {
    const languageMap: { [key: string]: number } = {};
    const allContributions = [
      ...(contributions?.audioContributions || []),
      ...(contributions?.videoContributions || []),
      ...(contributions?.textContributions || []),
      ...(contributions?.imageContributions || []),
      ...(contributions?.documentContributions || []),
    ];

    allContributions.forEach((item) => {
      if (item.language) {
        languageMap[item.language] = (languageMap[item.language] || 0) + 1;
      }
    });

    return Object.entries(languageMap)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([lang, count]) => ({ language: lang, count }));
  };

  const languageContributions = getLanguageContributions();

  const getMonthlyContributions = () => {
    const monthlyMap: { [key: string]: number } = {};
    const allContributions = [
      ...(contributions?.audioContributions || []),
      ...(contributions?.videoContributions || []),
      ...(contributions?.textContributions || []),
      ...(contributions?.imageContributions || []),
      ...(contributions?.documentContributions || []),
    ];

    allContributions.forEach((item) => {
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        const monthYear = `${date.toLocaleString('en-US', {
          month: 'short',
        })} ${date.getFullYear()}`;
        monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + 1;
      }
    });

    // Sort by year and then month
    return Object.entries(monthlyMap)
      .sort(([monthYearA], [monthYearB]) => {
        const [monthA, yearA] = monthYearA.split(' ');
        const [monthB, yearB] = monthYearB.split(' ');
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA.getTime() - dateB.getTime();
      })
      .map(([month, count]) => ({ month, count }));
  };

  const monthlyContributions = getMonthlyContributions();

  const calculateContributionStreak = () => {
    if (!contributions) return 0;

    const allContributions = [
      ...(contributions.audioContributions || []),
      ...(contributions.videoContributions || []),
      ...(contributions.textContributions || []),
      ...(contributions.imageContributions || []),
      ...(contributions.documentContributions || []),
    ].filter((item) => item.timestamp);

    if (allContributions.length === 0) {
      return 0;
    }

    // Sort by timestamp in descending order
    allContributions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    const uniqueDates = [
      ...new Set(
        allContributions.map((c) => new Date(c.timestamp).toDateString()),
      ),
    ];

    if (uniqueDates.length === 0) {
      return 0;
    }

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the most recent contribution was today or yesterday
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - mostRecentDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 1) {
      return 0; // Streak is broken if the last contribution was more than a day ago
    }

    streak = 1;
    let lastDate = mostRecentDate;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      currentDate.setHours(0, 0, 0, 0);

      const timeDiff = lastDate.getTime() - currentDate.getTime();
      const dayDiff = timeDiff / (1000 * 3600 * 24);

      if (dayDiff === 1) {
        streak++;
        lastDate = currentDate;
      } else {
        break; // Streak is broken
      }
    }

    return streak;
  };

  const contributionStreak = calculateContributionStreak();

  return (
    <div className="space-y-6">
      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          title="Total Uploads"
          value={contributions?.totalContributions || 0}
          unit="files"
          color="bg-green-50"
        />
        <DashboardCard
          icon={<Award size={20} className="text-purple-600" />}
          title="Total Hours Contributed"
          value={formatDuration(
            (contributions?.audioDuration || 0) +
              (contributions?.videoDuration || 0),
          )}
          color="bg-purple-50"
        />
        <DashboardCard
          icon={<Zap size={20} className="text-yellow-600" />}
          title="Contribution Streak"
          value={contributionStreak}
          unit="days"
          color="bg-yellow-50"
        />
        <DashboardCard
          icon={<Activity size={20} className="text-blue-600" />}
          title="Uploads Today"
          value={dailyStats?.uploads_today || 0}
          unit="files"
          color="bg-blue-50"
        />
      </div>

      {/* Contributions by Media Type */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Contributions by Media Type
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <MediaTypeCard
            type="Text"
            count={contributions?.contributionsByType.text || 0}
            icon={<Activity size={20} className="text-blue-600" />}
            color="bg-blue-50"
          />
          <MediaTypeCard
            type="Document"
            count={contributions?.contributionsByType.document || 0}
            icon={<BarChart size={20} className="text-red-600" />}
            color="bg-red-50"
          />
          <MediaTypeCard
            type="Image"
            count={contributions?.contributionsByType.image || 0}
            icon={<Award size={20} className="text-orange-600" />}
            color="bg-orange-50"
          />
          <MediaTypeCard
            type="Audio"
            count={contributions?.contributionsByType.audio || 0}
            duration={contributions?.audioDuration || 0}
            icon={<TrendingUp size={20} className="text-green-600" />}
            color="bg-green-50"
          />
          <MediaTypeCard
            type="Video"
            count={contributions?.contributionsByType.video || 0}
            duration={contributions?.videoDuration || 0}
            icon={<Calendar size={20} className="text-purple-600" />}
            color="bg-purple-50"
          />
        </div>
      </div>

      {/* Language Contributions */}
      {languageContributions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Languages Contributed To
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {languageContributions.slice(0, 6).map((lang, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm"
              >
                <Globe size={18} className="text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {lang.language.charAt(0).toUpperCase() +
                      lang.language.slice(1)}
                  </p>
                  <p className="text-xs text-gray-500">{lang.count} files</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Contributions */}
      {monthlyContributions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contributions Over Time
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {monthlyContributions.map((data, index) => (
              <div
                key={index}
                className="flex items-center p-3 bg-gray-50 rounded-lg shadow-sm"
              >
                <Calendar size={18} className="text-gray-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {data.month}
                  </p>
                  <p className="text-xs text-gray-500">{data.count} uploads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  icon,
  title,
  value,
  unit,
  color,
}) => (
  <div
    className={`p-5 rounded-lg shadow-sm flex items-center space-x-4 ${color}`}
  >
    <div className="flex-shrink-0">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

interface MediaTypeCardProps {
  type: string;
  count: number;
  duration?: number;
  icon: React.ReactNode;
  color: string;
}

const MediaTypeCard: React.FC<MediaTypeCardProps> = ({
  type,
  count,
  duration,
  icon,
  color,
}) => (
  <div className={`p-4 rounded-lg shadow-sm text-center ${color}`}>
    <div className="flex justify-center mb-2">{icon}</div>
    <p className="text-xl font-bold text-gray-900">{count}</p>
    <p className="text-sm text-gray-600">{type} Contributions</p>
    {duration !== undefined && duration > 0 && (
      <p className="text-xs text-gray-500 mt-1">
        {formatDuration(duration)} total
      </p>
    )}
  </div>
);

export default ContributionDashboard;
