const placeholder = (title) =>
  `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`;

const make = (id, title, author) => ({
  id,
  title,
  author,
  cover_image_url: placeholder(title),
});

export const mockHomeBooks = {
  latest: [
    make('l1', 'Think Again', 'David T. Schwartz'),
    make('l2', 'Don Nha Don Got Rua', 'Shoukei Matsumoto'),
    make('l3', 'Nhin Kho', 'Sergey Filonov'),
    make('l4', 'Danh Nhan Vat Ly', 'Nguyen Tuong'),
    make('l5', 'Danh Nhan Van Hoc', 'Nguyen Tuong'),
    make('l6', 'Danh Nhan Triet Hoc', 'Nguyen Tuong'),
  ],
  recommended: [
    make('r1', 'The Sun Also Rises', 'Ernest Hemingway'),
    make('r2', 'Mrs. Dalloway', 'Virginia Woolf'),
    make('r3', 'Treasure Island', 'Robert Louis Stevenson'),
  ],
  exclusive: [
    make('e1', 'Nang Dau Cuc Pham', 'Du Pham'),
    make('e2', 'So Cuu Luc Hao', 'Tu Vu'),
  ],
  highly_rated: [
    make('h1', 'Treasure Island', 'Robert Louis Stevenson'),
    make('h2', 'Stop Overthinking', 'Chase Hill, Scott Sharp'),
    make('h3', '30 Tuoi Moi Chi Moi', 'Ly Thong Lung'),
    make('h4', 'Chu Nghia Cau Toan', 'Lan Vy'),
  ],
  favorites: [
    make('f1', 'The Magic Of Thinking Big', 'Adam Grant'),
    make('f2', '30 Tuoi Moi Thu Chi', 'Ly Thuling Long'),
    make('f3', 'Stop Overthinking', 'Chase Hill, Scott Sharp'),
    make('f4', 'Content Va Thuat', 'Nho Xuat'),
    make('f5', 'Nang Cuc Pham', 'Du Nyan'),
    make('f6', 'Muon Kieu Nguoi Chon Cong So', 'Tran Viet Quan'),
  ],
};
