import React from 'react';

const Storage = () => {
  const storedBooks = [
    { id: 1, title: "Treasure Island", author: "Lorem Ipsum", cover: "https://via.placeholder.com/150x225" },
    { id: 2, title: "The Sun Also Rises", author: "Lorem Ipsum", cover: "https://via.placeholder.com/150x225" },
  ];

  return (
    <div className="storage-page">
      <h2 className="storage-title">STORAGE</h2>
      
      <div className="storage-grid">
        {storedBooks.map((book) => (
          <div key={book.id} className="storage-item">
            <div className="storage-cover-wrapper">
              <img src={book.cover} alt={book.title} className="storage-cover" />
            </div>
            <div className="storage-info">
              <h4 className="book-name">{book.title}</h4>
              <p className="book-author">{book.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Storage;