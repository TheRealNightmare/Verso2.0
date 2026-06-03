import { useEffect, useState } from 'react';
import BookSection from '../components/BookSection';
import PeopleRecommendations from '../components/PeopleRecommendations';
import Spinner from '../components/ui/Spinner';
import { fetchHomeBooks } from '../api/books';
import { fetchRecommendedBooks, fetchRecommendedPeople } from '../api/recommendations';
import usePageTitle from '../hooks/usePageTitle';
import { readCache, writeCache } from '../lib/cache';

const HOME_BOOKS_KEY = 'home_books';

const asArray = (value) => (Array.isArray(value) ? value : []);

const toSections = (data) => ({
  latest: asArray(data?.latest),
  exclusive: asArray(data?.exclusive),
  highly_rated: asArray(data?.highly_rated),
  favorites: asArray(data?.favorites),
});

function Home() {
  usePageTitle('Home');
  const cachedHome = readCache(HOME_BOOKS_KEY);
  const [sections, setSections] = useState(() =>
    cachedHome ? toSections(cachedHome.data) : {
      latest: [],
      exclusive: [],
      highly_rated: [],
      favorites: [],
    }
  );
  // With a cached payload we render instantly (stale-while-revalidate) and skip
  // the spinner; the background fetch below refreshes the shelves.
  const [loading, setLoading] = useState(!cachedHome);
  const [error, setError] = useState(null);
  const [recBooks, setRecBooks] = useState([]);
  const [recPeople, setRecPeople] = useState([]);
  const [recColdStart, setRecColdStart] = useState(false);

  // Recommendations are lazy-loaded separately so the main feed renders
  // instantly even when the AI re-rank step is slow on a cold cache.
  useEffect(() => {
    let cancelled = false;
    fetchRecommendedBooks()
      .then((data) => {
        if (cancelled) return;
        setRecBooks(data.books ?? []);
        setRecColdStart(!!data.coldStart);
      })
      .catch(() => { /* non-fatal: just hide the section */ });
    fetchRecommendedPeople()
      .then((data) => { if (!cancelled) setRecPeople(data.people ?? []); })
      .catch(() => { /* non-fatal */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchHomeBooks()
      .then((data) => {
        if (cancelled) return;
        setSections(toSections(data));
        writeCache(HOME_BOOKS_KEY, data);
      })
      .catch((err) => {
        if (cancelled) return;
        // Keep showing cached shelves on a failed background refresh.
        if (!cachedHome) setError(err?.message || 'Failed to load books.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const toCards = (books) =>
    asArray(books).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover_image_url,
      reason: b.reason,
    }));

  return (
    <div className="px-2 xl:flex xl:gap-6 xl:items-start">
      <div className="flex-1 min-w-0">
        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {recBooks.length > 0 && (
          <BookSection
            title={recColdStart ? 'Popular right now' : 'Recommended for you'}
            books={toCards(recBooks)}
          />
        )}
        {loading ? (
          <div className="px-2 py-6 text-sm text-gray-500">
            <Spinner label="Loading books…" />
          </div>
        ) : (
          <>
            <BookSection title="Latests" books={toCards(sections.latest)} />
            <BookSection title="Exclusive books" books={toCards(sections.exclusive)} />
            <BookSection title="Highly rated books" books={toCards(sections.highly_rated)} />
            <BookSection title="Favorite books" books={toCards(sections.favorites)} />
          </>
        )}
      </div>
      <aside className="mt-6 xl:mt-0 xl:w-72 xl:shrink-0 xl:sticky xl:top-6">
        <PeopleRecommendations people={recPeople} />
      </aside>
    </div>
  );
}

export default Home;
