export const dashboardStats = {
  totalBooks: 5000,
  completed: 50,
  quizScore: 50,
  lessons: 30,
};

export const hoursSpentData = [
  { month: 'Jan', hours: 55 },
  { month: 'Feb', hours: 15 },
  { month: 'Mar', hours: 42 },
  { month: 'Apr', hours: 78 },
  { month: 'May', hours: 62 },
];

export const performance = {
  point: 8.966,
  max: 10,
};

export const wormProgress = {
  value: 35,
  max: 100,
};

const avatar = (id) => `https://i.pravatar.cc/150?img=${id}`;

export const leaderboard = [
  {
    id: 1,
    rank: 1,
    name: 'Charlie Rawal',
    avatar: avatar(12),
    course: 53,
    hour: 250,
    point: 13.450,
    trend: 'up',
  },
  {
    id: 2,
    rank: 2,
    name: 'Ariana Agarwal',
    avatar: avatar(47),
    course: 88,
    hour: 212,
    point: 10.333,
    trend: 'down',
  },
  {
    id: 3,
    rank: 3,
    name: 'Brianna Charles',
    avatar: avatar(32),
    course: 88,
    hour: 212,
    point: 10.333,
    trend: 'down',
  },
];

export const todoItems = [
  {
    id: 't1',
    title: 'Theory of Networking',
    subtitle: 'Social Book',
    time: '08:00 AM',
    done: false,
  },
  {
    id: 't2',
    title: 'Learn about data',
    subtitle: '',
    time: '',
    done: false,
  },
  {
    id: 't3',
    title: '30 min of peace',
    subtitle: '',
    time: '',
    done: false,
  },
  {
    id: 't4',
    title: 'Poetry Session',
    subtitle: 'Art',
    time: '02:40 PM',
    done: false,
  },
  {
    id: 't5',
    title: 'Learn to sell',
    subtitle: 'Business',
    time: '04:50 PM',
    done: true,
  },
];

export const profileMock = {
  name: 'Peter',
  role: 'College Student',
  avatarUrl: avatar(15),
};
