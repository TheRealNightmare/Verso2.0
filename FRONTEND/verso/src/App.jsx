import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookDetails from './pages/BookDetails'; // We will build this with your components

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-container">
        <TopBar />
        
        {/* The URL determines which of these is visible */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetails />} />
        </Routes>

        <Footer />
      </main>
    </div>
  );
}

export default App;