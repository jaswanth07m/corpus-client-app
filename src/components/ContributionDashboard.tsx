import React from 'react';
import {
  Activity,
  TrendingUp,
  Award,
  Calendar,
  BarChart,
  Zap,
  Globe,
  Upload,
  Clock,
  Flame,
} from 'lucide-react';
import { formatModernTime, formatDuration, getISTDate } from '@/lib/utils';

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
        const dateIST = getISTDate(item.timestamp); // Convert UTC timestamp to IST Date object
        const monthYear = dateIST.toLocaleString('en-US', {
          month: 'short',
          year: 'numeric',
          timeZone: 'Asia/Kolkata', // Explicitly set timezone to IST
        });
        monthlyMap[monthYear] = (monthlyMap[monthYear] || 0) + 1;
      }
    });

    // Sort by year and then month
    return Object.entries(monthlyMap)
      .sort(([monthYearA], [monthYearB]) => {
        const dateA = new Date(monthYearA);
        const dateB = new Date(monthYearB);
        return (
          dateA.getFullYear() - dateB.getFullYear() ||
          dateA.getMonth() - dateB.getMonth()
        );
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

    // Sort by timestamp in descending order, using IST dates
    allContributions.sort(
      (a, b) =>
        getISTDate(b.timestamp).getTime() - getISTDate(a.timestamp).getTime(),
    );

    const uniqueDatesMillisIST = [
      ...new Set(
        allContributions.map((c) => {
          const istDate = getISTDate(c.timestamp);
          istDate.setHours(0, 0, 0, 0); // Set to start of IST day
          return istDate.getTime();
        }),
      ),
    ];

    if (uniqueDatesMillisIST.length === 0) {
      return 0;
    }

    let streak = 0;
    const todayIST = getISTDate(new Date().toISOString());
    todayIST.setHours(0, 0, 0, 0); // Set to start of IST day

    // Check if the most recent contribution was today or yesterday in IST
    const mostRecentDateMillisIST = uniqueDatesMillisIST[0];
    const mostRecentDateIST = new Date(mostRecentDateMillisIST); // Recreate Date object from millis

    const diffTime = todayIST.getTime() - mostRecentDateIST.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 1) {
      return 0; // Streak is broken if the last contribution was more than a day ago
    }

    streak = 1;
    let lastDateMillisIST = mostRecentDateMillisIST;

    for (let i = 1; i < uniqueDatesMillisIST.length; i++) {
      const currentDateMillisIST = uniqueDatesMillisIST[i];

      const timeDiff = lastDateMillisIST - currentDateMillisIST;
      const dayDiff = timeDiff / (1000 * 3600 * 24);

      if (dayDiff === 1) {
        streak++;
        lastDateMillisIST = currentDateMillisIST;
      } else {
        break; // Streak is broken
      }
    }

    return streak;
  };

  const calculateUploadsToday = () => {
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

    const todayIST = getISTDate(new Date().toISOString()); // Get current date in IST
    todayIST.setHours(0, 0, 0, 0); // Set to start of IST day

    let uploadsTodayCount = 0;
    allContributions.forEach((item) => {
      const itemDateIST = getISTDate(item.timestamp); // Convert UTC timestamp to IST Date object
      itemDateIST.setHours(0, 0, 0, 0); // Set to start of IST day
      if (itemDateIST.getTime() === todayIST.getTime()) {
        uploadsTodayCount++;
      }
    });
    return uploadsTodayCount;
  };

  const contributionStreak = calculateContributionStreak();
  const uploadsToday = calculateUploadsToday();

  return (
    <div className="space-y-2">
      {/* Stats Grid - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg p-2 text-white">
          <div className="flex flex-col items-center text-center">
            <TrendingUp size={14} className="opacity-80 mb-0.5" />
            <div className="text-xs font-medium opacity-90">Uploads</div>
            <div className="text-lg font-bold">
              {contributions?.totalContributions || 0}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-2 text-white">
          <div className="flex flex-col items-center text-center">
            <Clock size={14} className="opacity-80 mb-0.5" />
            <div className="text-xs font-medium opacity-90">Hours</div>
            <div className="text-lg font-bold">
              {formatDuration(
                (contributions?.audioDuration || 0) +
                  (contributions?.videoDuration || 0),
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg p-2 text-white">
          <div className="flex flex-col items-center text-center">
            <Flame size={14} className="opacity-80 mb-0.5" />
            <div className="text-xs font-medium opacity-90">Streak</div>
            <div className="text-lg font-bold">{contributionStreak}</div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-2 text-white">
          <div className="flex flex-col items-center text-center">
            <Upload size={14} className="opacity-80 mb-0.5" />
            <div className="text-xs font-medium opacity-90">Today</div>
            <div className="text-lg font-bold">{uploadsToday}</div>
          </div>
        </div>
      </div>

      {/* Contributions by Media Type - 2 Column Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 mb-1.5">
          Contributions by Media Type
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 text-white">
            <div className="flex flex-col items-center text-center">
              <Activity size={14} className="mb-0.5" />
              <span className="text-xs font-semibold">Text</span>
              <div className="text-lg font-bold">
                {contributions?.contributionsByType.text || 0}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-2 text-white">
            <div className="flex flex-col items-center text-center">
              <BarChart size={14} className="mb-0.5" />
              <span className="text-xs font-semibold">Doc</span>
              <div className="text-lg font-bold">
                {contributions?.contributionsByType.document || 0}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-2 text-white">
            <div className="flex flex-col items-center text-center">
              <Award size={14} className="mb-0.5" />
              <span className="text-xs font-semibold">Image</span>
              <div className="text-lg font-bold">
                {contributions?.contributionsByType.image || 0}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-2 text-white">
            <div className="flex flex-col items-center text-center">
              <TrendingUp size={14} className="mb-0.5" />
              <span className="text-xs font-semibold">Audio</span>
              <div className="text-lg font-bold">
                {contributions?.contributionsByType.audio || 0}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-2 text-white col-span-2">
            <div className="flex flex-col items-center text-center">
              <Calendar size={14} className="mb-0.5" />
              <span className="text-xs font-semibold">Video</span>
              <div className="text-lg font-bold">
                {contributions?.contributionsByType.video || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
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
