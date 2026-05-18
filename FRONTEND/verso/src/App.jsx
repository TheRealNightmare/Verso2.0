import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails';
import ReadingPage from './pages/ReadingPage';
import History from './pages/History';
import Storage from './pages/Storage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Event from './pages/Event';
import EventCreate from './pages/EventCreate';
import Community from './pages/Community';

function AppContent() {
  const location = useLocation();
  const isReadingMode = location.pathname.startsWith('/read');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const appRoutes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/events" element={<Event />} />
      <Route path="/create-event" element={<EventCreate />} />
      <Route path="/community" element={<Community />} />
      <Route path="/book/:id" element={<BookDetails />} />
      <Route path="/history" element={<History />} />
      <Route path="/storage" element={<Storage />} />
      <Route path="/read/:id" element={<ReadingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (isAuthPage) {
    return <div className="min-h-screen bg-[#f8f6f2]">{appRoutes}</div>;
  }

  return (
    <div className="flex min-h-screen bg-[#f8f6f2]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {!isReadingMode && <TopBar />}
        <div className="flex-1 p-6">{appRoutes}</div>
        {!isReadingMode && <Footer />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
