import BookSection from '../components/BookSection';

function Home() {
  const latestBooks = [
    { id: 1, title: "Think Again", author: "Adam Grant", cover: "https://via.placeholder.com/150x225" },
    { id: 2, title: "Mrs. Dalloway", author: "Virginia Woolf", cover: "https://via.placeholder.com/150x225" },
    { id: 3, title: "The Great Gatsby", author: "F. Scott Fitzgerald", cover: "https://via.placeholder.com/150x225" },
    { id: 4, title: "To Kill a Mockingbird", author: "Harper Lee", cover: "https://via.placeholder.com/150x225" },
    { id: 5, title: "1984", author: "George Orwell", cover: "https://via.placeholder.com/150x225" },
  ];

  return (
    <>
      <BookSection title="Latests" books={latestBooks} />
      <BookSection title="Recommended Books" books={latestBooks} />
      <BookSection title="Exclusive books" books={latestBooks} />
      <BookSection title="Highly rated books" books={latestBooks} />
      <BookSection title="Favorite books" books={latestBooks} />
    </>
  );
}

export default Home;