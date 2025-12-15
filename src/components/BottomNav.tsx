import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileCheck, User, LogOut } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication and cached data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('authToken');
    localStorage.removeItem('cachedProfile');

    // Clear all localStorage
    localStorage.clear();

    // Clear sessionStorage as well
    sessionStorage.clear();

    // Redirect to login page (home page which shows login)
    navigate('/', { replace: true });

    // Force page reload to reset all state
    window.location.href = '/';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-50 shadow-lg">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <svg
            className="w-6 h-6 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-xs text-slate-600">Home</span>
        </button>

        <Link
          to="/peer-review"
          className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <svg
            className="w-6 h-6 text-slate-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-xs text-slate-600">Review</span>
        </Link>

        <Link
          to="/annotations"
          className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <FileCheck className="w-6 h-6 text-slate-700" />
          <span className="text-xs text-slate-600">Annotate</span>
        </Link>

        <Link
          to="/myprofile"
          className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <User className="w-6 h-6 text-slate-700" />
          <span className="text-xs text-slate-600">Profile</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 p-2 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-6 h-6 text-red-500" />
          <span className="text-xs text-red-500">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
