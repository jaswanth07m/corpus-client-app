import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
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
            <Route path="/" element={<Navigate to="/media" replace />} />
            <Route
              path="/media"
              element={
                <RequireAuth>
                  <Index />
                </RequireAuth>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/media/:mediaType"
              element={
                <RequireAuth>
                  <UploadPage />
                </RequireAuth>
              }
            />
            <Route path="/annotations" element={<AnnotationsDashboard />} />
            <Route
              path="/annotations/proofreading"
              element={<Proofreading />}
            />
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
            <Route path="/peer-review" element={<PeerReview />} />
            {/* New route for ForgotPassword */}
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
