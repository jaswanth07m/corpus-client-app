import { useAuth } from '@/hooks/useAuth';
import { Flame, Upload, Edit } from 'lucide-react';

const UserStatsSummary = () => {
  const { user, isReady } = useAuth();

  if (!isReady || !user) {
    return (
      <div className="flex justify-center items-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Extract stats from user data
  const totalUploads = user.summary?.contributions?.total_contributions || 0;
  const totalEdits = user.summary?.edits?.total_edits || 0;
  const currentStreak = user.streaks?.combined_streak?.current || 0;
  const totalActivities = user.summary?.overall?.total_activities || 0;

  return (
    <div className="flex flex-wrap justify-center items-center gap-4 mb-6">
      {/* Current Streak */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 border border-orange-100">
        <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-600 leading-none">Streak</p>
          <p className="text-lg font-bold text-orange-600 leading-tight">
            {currentStreak} days
          </p>
        </div>
      </div>
      {/* Total Uploads */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 border border-blue-100">
        <Upload className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-600 leading-none">Uploads</p>
          <p className="text-lg font-bold text-blue-600 leading-tight">
            {totalUploads}
          </p>
        </div>
      </div>
      {/* Total Edits */}
      <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 border border-green-100">
        <Edit className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div>
          <p className="text-xs text-gray-600 leading-none">Edits</p>
          <p className="text-lg font-bold text-green-600 leading-tight">
            {totalEdits}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserStatsSummary;
