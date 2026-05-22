import { useEffect, useState } from 'react';
import BookSection from '../components/BookSection';
import Spinner from '../components/ui/Spinner';
import { fetchHomeBooks } from '../api/books';
import usePageTitle from '../hooks/usePageTitle';

function Home() {
  usePageTitle('Home');
  const [sections, setSections] = useState({
    latest: [],
    recommended: [],
    exclusive: [],
    highly_rated: [],
    favorites: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchHomeBooks()
      .then((data) => {
        if (cancelled) return;
        setSections({
          latest: data.latest ?? [],
          recommended: data.recommended ?? [],
          exclusive: data.exclusive ?? [],
          highly_rated: data.highly_rated ?? [],
          favorites: data.favorites ?? [],
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Failed to load books.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toCards = (books) =>
    (books || []).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover_image_url,
    }));

  return (
    <div className="px-2">
      {error && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading ? (
        <div className="px-2 py-6 text-sm text-gray-500">
          <Spinner label="Loading books…" />
        </div>
      ) : (
        <>
          <BookSection title="Latests" books={toCards(sections.latest)} />
          <BookSection title="Recommended books" books={toCards(sections.recommended)} />
          <BookSection title="Exclusive books" books={toCards(sections.exclusive)} />
          <BookSection title="Highly rated books" books={toCards(sections.highly_rated)} />
          <BookSection title="Favorite books" books={toCards(sections.favorites)} />
        </>
      )}
    </div>
  );
}

export default Home;
