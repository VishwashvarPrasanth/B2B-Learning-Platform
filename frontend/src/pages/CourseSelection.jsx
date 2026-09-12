import { useState, useEffect } from 'react'
import api from '../services/api'

function CourseSelection() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/enrollment', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCourses(res.data.courses)
      } catch (err) {
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId)
    try {
      await api.post('/enrollment/enroll',
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      // redirect to assessment for this course
      window.location.href = `/assessment/${courseId}`
    } catch (err) {
      setError(err.response?.data?.message || 'Enrollment failed')
    } finally {
      setEnrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-white/30 text-xs font-bold tracking-[2px] uppercase">// loading courses...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">

      {/* navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <span className="font-black text-white text-base tracking-tight">B2B Learn.</span>
        <span className="text-white/30 text-sm">{user.name}</span>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login' }}
          className="text-xs text-white/30 hover:text-white transition-colors"
        >
          Logout
        </button>
      </nav>

      <div className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">

        {/* header */}
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-3">
          // select a course
        </p>
        <h1 className="text-3xl font-black text-white tracking-tight leading-tight mb-2">
          What do you want<br />
          <em className="font-normal italic text-white/40" style={{ fontFamily: 'Georgia, serif' }}>
            to learn?
          </em>
        </h1>
        <p className="text-xs text-white/30 mb-10">
          Select a course to begin your personalised onboarding assessment.
        </p>

        {error && <p className="text-red-400 text-xs mb-6">{error}</p>}

        {/* courses grid */}
        {courses.length === 0 ? (
          <div className="border border-white/8 rounded-sm p-8 text-center">
            <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">
              // no courses available yet
            </p>
            <p className="text-white/15 text-xs mt-2">Ask your admin to publish courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {courses.map(course => (
              <div
                key={course._id}
                className="border border-white/8 rounded-sm p-6 hover:border-white/20 transition-all"
              >
                {/* course label */}
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-3">
                  // course
                </p>

                {/* course title */}
                <h2 className="text-lg font-black text-white tracking-tight mb-2">
                  {course.title}
                </h2>

                {/* description */}
                <p className="text-xs text-white/35 leading-relaxed mb-6">
                  {course.description}
                </p>

                {/* action */}
                {course.isEnrolled ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/40 border border-white/15 rounded-sm px-3 py-1.5">
                      ✓ Enrolled
                    </span>
                    
                      <a href={`/course/${course._id}`}
                      className="text-[9px] font-bold tracking-[1px] uppercase text-white hover:text-white/70 transition-colors"
                    >
                      Continue →
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrolling === course._id}
                    className="w-full bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40"
                  >
                    {enrolling === course._id ? 'Enrolling...' : 'Start assessment →'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default CourseSelection