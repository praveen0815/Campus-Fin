import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminLayout } from './components/AdminLayout'
import StudentLayout from './layouts/StudentLayout'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import DashboardPage from './pages/admin/DashboardPage'
import ManageSportsPage from './pages/admin/ManageSportsPage'
import ManageVenuesPage from './pages/admin/ManageVenuesPage'
import ManageSlotsPage from './pages/admin/ManageSlotsPage'
import BookingsPage from './pages/admin/BookingsPage'
import AnalyticsPage from './pages/admin/AnalyticsPage'
import StudentDashboardPage from './pages/student/StudentDashboardPage'
import BookSlotPage from './pages/student/BookSlotPage'
import MyBookingsPage from './pages/student/MyBookingsPage'
import StudentProfilePage from './pages/student/StudentProfilePage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout>
              <Routes>
                <Route path="" element={<DashboardPage />} />
                <Route path="sports" element={<ManageSportsPage />} />
                <Route path="venues" element={<ManageVenuesPage />} />
                <Route path="slots" element={<ManageSlotsPage />} />
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentLayout>
              <Routes>
                <Route path="dashboard" element={<StudentDashboardPage />} />
                <Route path="book" element={<BookSlotPage />} />
                <Route path="bookings" element={<MyBookingsPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
              </Routes>
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
