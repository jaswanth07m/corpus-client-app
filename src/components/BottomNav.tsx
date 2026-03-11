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
          id="tour-home-nav"
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
          id="tour-tools-nav"
          to="/tools"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive('/tools') ? 'text-blue-600' : 'hover:bg-slate-50 text-slate-700'}`}
        >
          <PencilRuler
            className={`w-6 h-6 ${isActive('/tools') ? 'text-blue-600' : 'text-slate-700'}`}
          />
        </Link>

        <Link
          id="tour-profile-nav"
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
