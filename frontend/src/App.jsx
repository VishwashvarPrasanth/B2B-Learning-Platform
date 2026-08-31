import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Public pages
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))

// Learner pages
const Assessment = lazy(() => import('./pages/Assessment'))
const CourseSelection = lazy(() => import('./pages/CourseSelection'))
const CourseAssessment = lazy(() => import('./pages/CourseAssessment'))
const CourseAssessmentResult = lazy(() => import('./pages/CourseAssessmentResult'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CoursePage = lazy(() => import('./pages/CoursePage'))

// Admin page
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>

          {/* Public Routes */}
          <Route path='/' element={<Login />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Protected Learner Routes */}
          <Route
            path='/assessment'
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />

          <Route
            path='/courses'
            element={
              <ProtectedRoute>
                <CourseSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path='/assessment/:courseId'
            element={
              <ProtectedRoute>
                <CourseAssessment />
              </ProtectedRoute>
            }
          />

          <Route
            path='/assessment/:courseId/result'
            element={
              <ProtectedRoute>
                <CourseAssessmentResult />
              </ProtectedRoute>
            }
          />

          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path='/course/:id'
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path='/admin'
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
