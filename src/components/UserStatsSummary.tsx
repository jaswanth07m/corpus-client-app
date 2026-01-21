import { useAuth } from '@/hooks/useAuth';

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
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      {/* Current Streak */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <p className="text-sm text-gray-600">Streak</p>
        <p className="text-2xl font-bold text-orange-600">
          {currentStreak} days
        </p>
      </div>

      {/* Total Uploads */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <p className="text-sm text-gray-600">Uploads</p>
        <p className="text-2xl font-bold text-blue-600">{totalUploads}</p>
      </div>

      {/* Total Edits */}
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <p className="text-sm text-gray-600">Edits</p>
        <p className="text-2xl font-bold text-green-600">{totalEdits}</p>
      </div>
    </div>
  );
};

export default UserStatsSummary;
