import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import Index from './pages/Index';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import DocDigitization from './pages/DocDigitization';
import AnnotationsDashboard from './pages/AnnotationsDashboard';
import Profile from './pages/Profile';
import MyProfileRedirect from './pages/MyProfileRedirect';
import PeerReview from './pages/PeerReview';
import ImageReviewPage from './pages/ImageReviewPage';
import AudioReviewPage from './pages/AudioReviewPage';
import VideoReviewPage from './pages/VideoReviewPage';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';
import UploadPage from './pages/UploadPage';
import Layout from './Layout';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import RecordDetails from './pages/RecordDetails';
import CompleteProfileGeneralPage from './pages/CompleteProfileGeneralPage';
import CompleteProfileInternPage from './pages/CompleteProfileInternPage';

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <AuthProvider>
            <UserPreferencesProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  element={
                    <RequireAuth>
                      <Layout />
                    </RequireAuth>
                  }
                >
                  <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <LandingPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <RequireAuth>
                        <Index />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/upload/:mediaType"
                    element={
                      <RequireAuth>
                        <UploadPage />
                      </RequireAuth>
                    }
                  />
                  <Route path="/tools" element={<AnnotationsDashboard />} />
                  <Route
                    path="/doc-digitization"
                    element={<AnnotationsDashboard />}
                  />
                  <Route
                    path="/myprofile/"
                    element={
                      <RequireAuth>
                        <Navigate to="/profile" replace />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/userprofile/:userId"
                    element={<Navigate to="/profile/:username" replace />}
                  />
                  <Route
                    path="/profile"
                    element={
                      <RequireAuth>
                        <MyProfileRedirect />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/profile/:username"
                    element={
                      <RequireAuth>
                        <Profile />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/complete-profile"
                    element={<Navigate to="/complete-profile/step-2" replace />}
                  />
                  <Route
                    path="/complete-profile/step-2"
                    element={
                      <RequireAuth>
                        <CompleteProfileGeneralPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/complete-profile/step-3"
                    element={
                      <RequireAuth>
                        <CompleteProfileInternPage />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/peer-review"
                    element={
                      <RequireAuth>
                        <PeerReview />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/records/:recordId"
                    element={
                      <RequireAuth>
                        <RecordDetails />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/shared/:recordId"
                    element={<RecordDetails isSharedView={true} />}
                  />
                </Route>

                <Route
                  path="/tools/doc-digitization"
                  element={
                    <RequireAuth>
                      <DocDigitization />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/tools/image-review"
                  element={
                    <RequireAuth>
                      <ImageReviewPage />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/tools/audio-review"
                  element={
                    <RequireAuth>
                      <AudioReviewPage />
                    </RequireAuth>
                  }
                />

                <Route
                  path="/tools/video-review"
                  element={
                    <RequireAuth>
                      <VideoReviewPage />
                    </RequireAuth>
                  }
                />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </UserPreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
