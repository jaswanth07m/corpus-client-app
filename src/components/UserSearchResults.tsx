import React from 'react';

interface User {
  username: string;
}

interface UserSearchResultsProps {
  users: User[];
  onSelectUser: (username: string) => void;
  isLoading?: boolean;
  error?: string;
  isVisible?: boolean;
  onClose?: () => void;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  users,
  onSelectUser,
  isLoading = false,
  error,
  isVisible = true,
  onClose,
}) => {
  if (!isVisible) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative z-10 bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md max-h-60 overflow-y-auto">
          <div className="py-2">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="p-3 hover:bg-slate-50 cursor-pointer transition-colors duration-200 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative z-10 bg-white rounded-lg shadow-xl border border-red-200 w-full max-w-md p-4">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative z-10 bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-4">
          <div className="text-slate-600 text-sm">No users found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative z-10 bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md max-h-96 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {users.map((user, index) => (
            <div
              key={index}
              onClick={() => onSelectUser(user.username)}
              className="p-3 hover:bg-slate-50 cursor-pointer transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="font-medium text-slate-900">@{user.username}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserSearchResults;
