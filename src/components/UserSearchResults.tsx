import React from 'react';

interface User {
  username: string;
}

interface UserSearchResultsProps {
  users: User[];
  onSelectUser: (username: string) => void;
  isLoading?: boolean;
  error?: string;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  users,
  onSelectUser,
  isLoading = false,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="py-8">
        <div className="flex flex-col space-y-4">
          {[...Array(5)].map((_, index) => (
            <div
              key={index}
              className="p-4 bg-white rounded-lg border border-slate-200 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-slate-600">No users found</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="space-y-2">
        {users.map((user, index) => (
          <div
            key={index}
            onClick={() => onSelectUser(user.username)}
            className="p-3 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors duration-200"
          >
            <div className="font-medium text-slate-900">@{user.username}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSearchResults;
