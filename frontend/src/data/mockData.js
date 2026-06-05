export const books = [
  {
    id: 'BK-1042',
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Technology',
    isbn: '978-1449373320',
    status: 'Issued',
    dueDate: '26 May 2026',
    expectedReturn: '26 May 2026',
    queue: 3,
    cover: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'BK-2218',
    title: 'Atomic Habits',
    author: 'James Clear',
    category: 'Self Development',
    isbn: '978-0735211292',
    status: 'Available',
    dueDate: '-',
    expectedReturn: '-',
    queue: 0,
    cover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'BK-3140',
    title: 'The Lean Startup',
    author: 'Eric Ries',
    category: 'Business',
    isbn: '978-0307887894',
    status: 'Reserved',
    dueDate: '21 May 2026',
    expectedReturn: '22 May 2026',
    queue: 1,
    cover: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'BK-4430',
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    category: 'Technology',
    isbn: '978-0134494166',
    status: 'Available',
    dueDate: '-',
    expectedReturn: '-',
    queue: 0,
    cover: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=500&q=80',
  },
  {
    id: 'BK-7084',
    title: 'Blue Ocean Strategy',
    author: 'W. Chan Kim',
    category: 'Strategy',
    isbn: '978-1625274496',
    status: 'Lost/Damaged',
    dueDate: '-',
    expectedReturn: 'Under review',
    queue: 0,
    cover: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=500&q=80',
  },
];

export const employees = [
  { id: 'EMP-1021', name: 'Riya Shah', email: 'riya.shah@adani.com', department: 'Operations', borrowed: 3, penalty: 'None' },
  { id: 'EMP-1184', name: 'Aarav Mehta', email: 'aarav.mehta@adani.com', department: 'Finance', borrowed: 1, penalty: '₹120' },
  { id: 'EMP-1408', name: 'Nisha Rao', email: 'nisha.rao@adani.com', department: 'Technology', borrowed: 4, penalty: 'None' },
  { id: 'EMP-1512', name: 'Kabir Singh', email: 'kabir.singh@adani.com', department: 'HR', borrowed: 2, penalty: '₹40' },
];

export const reservations = [
  { employee: 'Riya Shah', book: 'The Lean Startup', date: '14 May 2026', queue: 1, expected: '22 May 2026', status: 'Waiting' },
  { employee: 'Aarav Mehta', book: 'Designing Data-Intensive Applications', date: '15 May 2026', queue: 3, expected: '26 May 2026', status: 'Queued' },
  { employee: 'Nisha Rao', book: 'Deep Work', date: '16 May 2026', queue: 2, expected: '28 May 2026', status: 'Ready Soon' },
];

export const notifications = [
  { type: 'Due Reminder', title: 'Clean Architecture is due in 3 days', meta: 'Return by 19 May 2026', tone: 'sky' },
  { type: 'Reservation', title: 'The Lean Startup will be available soon', meta: 'Queue position 1', tone: 'mint' },
  { type: 'Penalty Alert', title: '₹120 penalty pending for overdue return', meta: 'Grace period ended', tone: 'amber' },
  { type: 'System', title: 'QR return window extended for today', meta: 'Admin notice', tone: 'navy' },
];

export const recentActivity = [
  { time: '10:42 AM', event: 'Book issued', user: 'Riya Shah', item: 'Atomic Habits' },
  { time: '11:08 AM', event: 'Reservation added', user: 'Aarav Mehta', item: 'Designing Data-Intensive Applications' },
  { time: '12:16 PM', event: 'Penalty paid', user: 'Kabir Singh', item: '₹40 collected' },
  { time: '02:30 PM', event: 'QR generated', user: 'Admin', item: 'Clean Architecture' },
];

export const categoryData = [
  { name: 'Technology', value: 34 },
  { name: 'Business', value: 22 },
  { name: 'Strategy', value: 18 },
  { name: 'Leadership', value: 15 },
  { name: 'Finance', value: 11 },
];

export const monthlyData = [
  { month: 'Jan', issued: 148, returned: 132, overdue: 12 },
  { month: 'Feb', issued: 172, returned: 155, overdue: 16 },
  { month: 'Mar', issued: 164, returned: 158, overdue: 10 },
  { month: 'Apr', issued: 190, returned: 174, overdue: 19 },
  { month: 'May', issued: 212, returned: 196, overdue: 14 },
  { month: 'Jun', issued: 198, returned: 189, overdue: 9 },
];

export const popularBooks = [
  { name: 'Atomic Habits', borrows: 86 },
  { name: 'Clean Architecture', borrows: 74 },
  { name: 'The Lean Startup', borrows: 68 },
  { name: 'Deep Work', borrows: 61 },
];
