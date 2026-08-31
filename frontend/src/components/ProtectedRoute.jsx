import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute component to guard routes that require authentication
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child component to render if allowed
 * @param {boolean} [props.adminOnly=false] - Whether this route requires admin role
 */
function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // Not logged in -> redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Admin-only route requested by a non-admin user -> redirect to dashboard
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
