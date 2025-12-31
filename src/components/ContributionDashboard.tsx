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
  Edit,
} from 'lucide-react';
import { formatModernTime, formatDuration, getISTDate } from '@/lib/utils';
import { Value } from '@radix-ui/react-select';

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
  edits: number;
}

const ContributionDashboard: React.FC<ContributionDashboardProps> = ({
  dailyStats,
  contributions,
  loading,
  edits,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Stats Grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {[
          {
            label: 'Uploads',
            value: contributions?.totalContributions || 0,
            color: 'linear-gradient(135deg, #34d399, #10b981)',
            icon: <TrendingUp size={14} />,
          },
          {
            label: 'Edits',
            value: edits,
            color: '#aada00ff',
            icon: <Edit size={14} />,
          },
          {
            label: 'Streak',
            value: contributionStreak,
            color: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            icon: <Flame size={14} />,
          },
          {
            label: 'Hours',
            value: formatDuration(
              (contributions?.audioDuration || 0) +
                (contributions?.videoDuration || 0),
            ),
            color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
            icon: <Clock size={14} />,
          },
          {
            label: 'Today',
            value: uploadsToday,
            color: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            icon: <Upload size={14} />,
          },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              width: item.full ? '100%' : 'calc(32% - 4px)',
              background: item.color,
              borderRadius: 8,
              padding: 8,
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div className="flex justify-center items-center gap-2">
              <div style={{ fontSize: 12, opacity: 0.9 }}>{item.label}</div>
              <div style={{ opacity: 0.85, marginBottom: 2 }}>{item.icon}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{item.value}</div>
          </div>
        ))}
      </div>

      <hr />

      {/* Contributions by Media Type */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            {
              label: 'Text',
              value: contributions?.contributionsByType.text || 0,
              color: '#3b82f6',
              icon: <Activity size={14} />,
            },
            {
              label: 'Doc',
              value: contributions?.contributionsByType.document || 0,
              color: '#ef4444',
              icon: <BarChart size={14} />,
            },
            {
              label: 'Image',
              value: contributions?.contributionsByType.image || 0,
              color: '#f97316',
              icon: <Award size={14} />,
            },
            {
              label: 'Audio',
              value: contributions?.contributionsByType.audio || 0,
              color: '#22c55e',
              icon: <TrendingUp size={14} />,
            },
            {
              label: 'Video',
              value: contributions?.contributionsByType.video || 0,
              color: '#8b5cf6',
              icon: <Calendar size={14} />,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                width: item.full ? '100%' : 'calc(32% - 4px)',
                background: item.color,
                borderRadius: 8,
                padding: 8,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              <div className="flex justify-center items-center gap-2">
                <div style={{ fontSize: 12, opacity: 0.9 }}>{item.label}</div>
                <div style={{ opacity: 0.85, marginBottom: 2 }}>
                  {item.icon}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                {item.value}
              </div>
            </div>
          ))}
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
