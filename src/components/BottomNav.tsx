import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PencilRuler, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Function to check if the current path matches the link
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 z-50 shadow-lg bottom-nav">
      <div className="flex items-center justify-around max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/') ? 'text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <svg
            className={`w-6 h-6 ${isActive('/') ? 'text-blue-600' : 'text-slate-700'}`}
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
        </button>

        <Link
          to="/peer-review"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/peer-review') ? 'text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <svg
            className={`w-6 h-6 ${isActive('/peer-review') ? 'text-blue-600' : 'text-slate-700'}`}
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
        </Link>

        <Link
          to="/annotations"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/annotations') ? 'text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <PencilRuler
            className={`w-6 h-6 ${isActive('/annotations') ? 'text-blue-600' : 'text-slate-700'}`}
          />
        </Link>

        <Link
          to="/profile"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/profile') ? 'text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <User
            className={`w-6 h-6 ${isActive('/profile') ? 'text-blue-600' : 'text-slate-700'}`}
          />
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
