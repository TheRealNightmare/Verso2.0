import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { NotificationsProvider } from './context/NotificationsContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import ReadingPage from './pages/ReadingPage';
import UploadReadingPage from './pages/UploadReadingPage';
import History from './pages/History';
import Storage from './pages/Storage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Event from './pages/Event';
import EventCreate from './pages/EventCreate';
import Community from './pages/Community';
import UserProfile from './pages/UserProfile';
import Messages from './pages/Messages';
import AuthorPublishPage from './pages/AuthorPublishPage';
import AuthorDashboard from './pages/AuthorDashboard';

function AppContent() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isReadingMode = location.pathname.startsWith('/read') || location.pathname.startsWith('/reading');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const appRoutes = (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><Event /></ProtectedRoute>} />
      <Route path="/create-event" element={<ProtectedRoute><EventCreate /></ProtectedRoute>} />
      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/book/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><Storage /></ProtectedRoute>} />
      <Route path="/read/:id" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
      <Route path="/reading/upload/:uploadId" element={<ProtectedRoute><UploadReadingPage /></ProtectedRoute>} />
      <Route path="/author/publish" element={<ProtectedRoute><AuthorPublishPage /></ProtectedRoute>} />
      <Route path="/author/dashboard" element={<ProtectedRoute><AuthorDashboard /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#f8f6f2]">{appRoutes}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f6f2]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:rounded-lg focus:bg-[#5b7c99] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <div className="flex flex-1 min-h-0">
        <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <main id="main" className="flex-1 flex flex-col min-w-0">
          {!isReadingMode && <TopBar onMenuClick={() => setDrawerOpen(true)} />}
          <div className="flex-1 p-3 sm:p-4 lg:p-6">{appRoutes}</div>
        </main>
      </div>
      {!isReadingMode && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <NotificationsProvider>
            <AppContent />
          </NotificationsProvider>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
