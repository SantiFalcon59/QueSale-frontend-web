/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Lazy load pages for performance
const Home = React.lazy(() => import('./pages/Home'));
const Feed = React.lazy(() => import('./pages/Feed'));
const Discovery = React.lazy(() => import('./pages/Discovery'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const EventDetail = React.lazy(() => import('./pages/EventDetail'));
const MyTickets = React.lazy(() => import('./pages/MyTickets'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const Communities = React.lazy(() => import('./pages/Communities'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Register = React.lazy(() => import('./pages/Auth/Register'));
const SetupProfile = React.lazy(() => import('./pages/Auth/SetupProfile'));
const OrganizerDashboard = React.lazy(() => import('./pages/Organizer/Dashboard'));
const CreateEvent = React.lazy(() => import('./pages/Organizer/CreateEvent'));
const AdminOrganizations = React.lazy(() => import('./pages/Admin/AdminOrganizations'));
const AdminPanel = React.lazy(() => import('./pages/Admin/AdminPanel'));

import { useAuth } from './context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (user && !profile?.username && location.pathname !== '/setup-profile') {
    return <Navigate to="/setup-profile" replace />;
  }

  return <>{children}</>;
};

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) return null;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="min-h-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <div className="relative flex min-h-screen bg-background overflow-x-hidden font-sans">
          {/* Hyper-Cosmic Ambient Elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/20 blur-[180px] rounded-full animate-pulse mix-blend-screen" style={{ animationDuration: '6s' }} />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-secondary/15 blur-[180px] rounded-full animate-pulse mix-blend-screen" style={{ animationDuration: '10s' }} />
            <div className="absolute top-[20%] right-[-15%] w-[50%] h-[50%] bg-tertiary/15 blur-[160px] rounded-full animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
            <div className="absolute middle-[50%] left-[-20%] w-[45%] h-[45%] bg-primary/10 blur-[140px] rounded-full animate-pulse mix-blend-screen" style={{ animationDuration: '12s' }} />
          </div>

          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <div className={cn(
            "flex-1 transition-all duration-300 min-w-0 w-full",
            "ml-0 lg:ml-64"
          )}>
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

            <main className="mt-16 min-h-[calc(100vh-64px)] overflow-x-hidden">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              }>
                <AnimatePresence mode="wait">
                  <Routes>
...
                    <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                    <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                    <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                    <Route path="/setup-profile" element={<AuthGuard><PageWrapper><SetupProfile /></PageWrapper></AuthGuard>} />
                    
                    <Route path="/feed" element={<PageWrapper><Feed /></PageWrapper>} />
                    <Route path="/discovery" element={<PageWrapper><Discovery /></PageWrapper>} />
                    <Route path="/map" element={<PageWrapper><MapPage /></PageWrapper>} />
                    <Route path="/communities" element={<PageWrapper><Communities /></PageWrapper>} />
                    <Route path="/tos" element={<PageWrapper><TermsOfService /></PageWrapper>} />
                    <Route path="/notifications" element={<AuthGuard><PageWrapper><Notifications /></PageWrapper></AuthGuard>} />
                    <Route path="/favorites" element={<AuthGuard><PageWrapper><Favorites /></PageWrapper></AuthGuard>} />
                    <Route path="/tickets" element={<AuthGuard><PageWrapper><MyTickets /></PageWrapper></AuthGuard>} />
                    <Route path="/saved" element={<Navigate to="/favorites" replace />} />
                    <Route path="/u/:username" element={<AuthGuard><PageWrapper><Profile /></PageWrapper></AuthGuard>} />
                    <Route path="/events/:id" element={<PageWrapper><EventDetail /></PageWrapper>} />
                    <Route path="/organizer" element={<AuthGuard><PageWrapper><OrganizerDashboard /></PageWrapper></AuthGuard>} />
                    <Route path="/organizer/new" element={<AuthGuard><PageWrapper><CreateEvent /></PageWrapper></AuthGuard>} />
                    <Route path="/admin" element={<AuthGuard><AdminGuard><PageWrapper><AdminPanel /></PageWrapper></AdminGuard></AuthGuard>} />
                    
                    <Route path="*" element={<PageWrapper><Home /></PageWrapper>} />
                  </Routes>
                </AnimatePresence>
              </Suspense>
            </main>
            <Footer />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}
