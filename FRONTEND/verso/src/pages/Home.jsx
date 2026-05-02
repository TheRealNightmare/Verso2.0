import { useEffect, useState } from 'react';
import BookSection from '../components/BookSection';
import { fetchHomeBooks } from '../api/books';

function Home() {
  const [sections, setSections] = useState({
    latest: [],
    recommended: [],
    exclusive: [],
    highly_rated: [],
    favorites: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeBooks()
      .then((data) => setSections(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toCards = (books) =>
    (books || []).map((b) => ({ id: b.id, title: b.title, author: b.author, cover: b.cover_image_url }));

  if (loading) {
    return <p style={{ padding: '2rem', color: '#aaa' }}>Loading books...</p>;
  }

  return (
    <>
      <BookSection title="Latest"          books={toCards(sections.latest)} />
      <BookSection title="Recommended"     books={toCards(sections.recommended)} />
      <BookSection title="Exclusive books" books={toCards(sections.exclusive)} />
      <BookSection title="Highly Rated"    books={toCards(sections.highly_rated)} />
      <BookSection title="Favorite books"  books={toCards(sections.favorites)} />
    </>
  );
}

export default Home;
