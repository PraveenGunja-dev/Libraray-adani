import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import PinChange from './pages/PinChange.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import BookBorrow from './pages/employee/BookBorrow.jsx';
import Reservations from './pages/employee/Reservations.jsx';
import ReturnBook from './pages/employee/ReturnBook.jsx';
import EmployeeProfile from './pages/employee/EmployeeProfile.jsx';
import Notifications from './pages/shared/Notifications.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import BookManagement from './pages/admin/BookManagement.jsx';
import EmployeeManagement from './pages/admin/EmployeeManagement.jsx';
import ReservationManagement from './pages/admin/ReservationManagement.jsx';
import Reports from './pages/admin/Reports.jsx';
import Settings from './pages/admin/Settings.jsx';
import LostRequests from './pages/admin/LostRequests.jsx';
import QRScan from './pages/admin/QRScan.jsx';
import AppShell from './components/AppShell.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/pin-change" element={<PinChange />} />
      <Route path="/employee" element={<ProtectedRoute role="employee" />}>
        <Route element={<AppShell mode="employee" />}>
          <Route index element={<EmployeeDashboard />} />
          <Route path="book" element={<BookBorrow />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="return" element={<ReturnBook />} />
          <Route path="notifications" element={<Notifications audience="employee" />} />
          <Route path="profile" element={<EmployeeProfile />} />
        </Route>
      </Route>
      <Route path="/admin" element={<ProtectedRoute role="admin" />}>
        <Route element={<AppShell mode="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="scan" element={<QRScan />} />
          <Route path="books" element={<BookManagement />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="reservations" element={<ReservationManagement />} />
          <Route path="lost" element={<LostRequests />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
