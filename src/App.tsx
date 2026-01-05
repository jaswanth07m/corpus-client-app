import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword'; // Import the new component
import Proofreading from './pages/Proofreading';
import AnnotationsDashboard from './pages/AnnotationsDashboard';
import Profile from './pages/Profile';
import MyProfileRedirect from './pages/MyProfileRedirect';
import PeerReview from './pages/PeerReview';
import { AuthProvider } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import RequireAuth from './components/RequireAuth';
import { User } from 'lucide-react';
import Categories from './components/Categories';
import UploadPage from './pages/UploadPage';
import Layout from './Layout';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
              <Route path="/" element={<Navigate to="/landing" replace />} />
              <Route
                path="/landing"
                element={
                  <RequireAuth>
                    <LandingPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/media"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />
              <Route
                path="/media/:mediaType"
                element={
                  <RequireAuth>
                    <UploadPage />
                  </RequireAuth>
                }
              />
              <Route path="/annotations" element={<AnnotationsDashboard />} />
              <Route path="/proofreading" element={<AnnotationsDashboard />} />
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
                path="/peer-review"
                element={
                  <RequireAuth>
                    <PeerReview />
                  </RequireAuth>
                }
              />
            </Route>

            <Route
              path="/annotations/proofreading"
              element={
                <RequireAuth>
                  <Proofreading />
                </RequireAuth>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
