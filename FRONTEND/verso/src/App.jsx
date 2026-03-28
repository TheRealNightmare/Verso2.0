import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails'; 
import ReadingPage from './pages/ReadingPage';
import History from './pages/History';
import Storage from './pages/Storage';

function App() {

  const location = useLocation();
  const isReadingMode = location.pathname.startsWith('/read');
  return (
    <div className="app-layout">
  <Sidebar />
  <main className="app-container">
    {!isReadingMode && <TopBar />}
    
    {/* Wrap your Routes in a div that we can tell to "grow" */}
    <div className="page-content">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/history" element={<History />} />
        <Route path="/storage" element={<Storage />} />
        <Route path="/read/:id" element={<ReadingPage />} />
        
      </Routes>
    </div>

    {!isReadingMode && <Footer />}
  </main>
</div>
  );
}

export default App;