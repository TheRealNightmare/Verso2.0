import BookSection from '../components/BookSection';
import { mockHomeBooks } from '../mocks/books';

function Home() {
  const sections = mockHomeBooks;

  const toCards = (books) =>
    (books || []).map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      cover: b.cover_image_url,
    }));

  return (
    <div className="px-2">
      <BookSection title="Latests" books={toCards(sections.latest)} />
      <BookSection title="Recommended books" books={toCards(sections.recommended)} />
      <BookSection title="Exclusive books" books={toCards(sections.exclusive)} />
      <BookSection title="Highly rated books" books={toCards(sections.highly_rated)} />
      <BookSection title="Favorite books" books={toCards(sections.favorites)} />
    </div>
  );
}

export default Home;
