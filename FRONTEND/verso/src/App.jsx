import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails'; 
import ReadingPage from './pages/ReadingPage';
import History from './pages/History';

function App() {

  const location = useLocation();
  const isReadingMode = location.pathname.startsWith('/read');
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-container">
       {!isReadingMode && <TopBar />}
        
    
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route path="/read/:id" element={<ReadingPage />} />
          <Route path="/history" element={<History />} />
        </Routes>

       {!isReadingMode && <Footer />}
      </main>
    </div>
  );
}

export default App;