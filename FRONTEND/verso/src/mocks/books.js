const placeholder = (title) =>
  `https://via.placeholder.com/200x300?text=${encodeURIComponent(title)}`;

const avatar = (seed) => `https://i.pravatar.cc/100?u=${seed}`;

const defaultDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

const defaultComments = [
  {
    id: 'c1',
    user: 'Harleen Quinzel',
    avatar: avatar('harleen'),
    time: '11:22 PM',
    text: 'AMAZING!!',
  },
];

const make = (id, title, author, extras = {}) => ({
  id,
  title,
  author,
  cover_image_url: placeholder(title),
  description: defaultDescription,
  genre: 'Romance',
  producer: 'Updating',
  release_status: '25/50',
  rating: 4,
  reviews_count: 1,
  bestseller_tag: null,
  comments: defaultComments,
  ...extras,
});

export const mockHomeBooks = {
  latest: [
    make('l1', 'Think Again', 'Dong Vu', {
      bestseller_tag: '#1 NEW YORK TIMES BESTSELLER',
    }),
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

const defaultBook = make('l1', 'Think Again', 'Dong Vu', {
  bestseller_tag: '#1 NEW YORK TIMES BESTSELLER',
});

export const getBookById = (id) => {
  const all = Object.values(mockHomeBooks).flat();
  return all.find((b) => b.id === id) ?? defaultBook;
};
