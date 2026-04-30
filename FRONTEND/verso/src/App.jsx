import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const location = useLocation();
  const isReadingMode = location.pathname.startsWith('/read');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const appRoutes = (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/book/:id" element={<ProtectedRoute><BookDetails /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/storage" element={<ProtectedRoute><Storage /></ProtectedRoute>} />
      <Route path="/read/:id" element={<ProtectedRoute><ReadingPage /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );

  if (isAuthPage) {
    return <div className="auth-layout">{appRoutes}</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-container">
        {!isReadingMode && <TopBar />}
        <div className="page-content">
          {appRoutes}
        </div>
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
