import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CloudUpload } from 'lucide-react';
import UserStatsSummary from '@/components/UserStatsSummary';

const LandingPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 relative overflow-hidden">
      {/* Decorative background elements matching login page */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-4xl w-full mx-auto py-8">
        {/* Stats Summary at the top */}
        <UserStatsSummary />

        <div className="text-center space-y-20">
          {/* Swecha Logo */}
          <div className="animate-fade-in-smooth">
            <img
              src="/Swecha_Logo_English.png"
              alt={t('common.swechaTechnologyForSociety')}
              className="h-28 mx-auto drop-shadow-lg hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Circular Upload Button */}
          <div className="animate-fade-in-delay-smooth flex justify-center">
            <button
              onClick={() => navigate('/media')}
              className="group relative w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-2xl transform transition-all duration-500 hover:scale-105 hover:shadow-emerald-500/50 overflow-hidden"
            >
              <div className="absolute -inset-2 bg-gradient-to-br from-emerald-300 to-emerald-500 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping-slow"></div>
                  <div
                    className="absolute inset-0 bg-white/10 rounded-full"
                    style={{
                      animation:
                        'ping-slow 4s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  ></div>
                  <div className="relative bg-white/25 backdrop-blur-md rounded-full p-6 group-hover:bg-white/35 transition-all duration-500 shadow-lg">
                    <CloudUpload
                      className="w-24 h-24 text-white animate-upload-float drop-shadow-lg"
                      strokeWidth={2.5}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-white drop-shadow-md">
                    {t('common.uploadFiles')}
                  </h2>
                  <p className="text-white/80 text-sm font-medium">
                    {t('common.click.to.get.started')}
                  </p>
                </div>
              </div>

              <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition-all duration-500"></div>
            </button>
          </div>

          <p className="text-slate-500 text-sm animate-fade-in-late">
            {t('common.contributeToOpenDataAndHelpBuildTheFuture')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
