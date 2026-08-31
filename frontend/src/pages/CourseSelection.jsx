import { useState, useEffect } from 'react'
import api from '../services/api'

function CourseSelection() {
  const [courses, setCourses] = useState([])
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(null)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // fetch courses and existing roadmaps in parallel
        const [coursesRes, roadmapsRes] = await Promise.all([
          api.get('/enrollment', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/roadmap/all', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        setCourses(coursesRes.data.courses)
        setRoadmaps(roadmapsRes.data.roadmaps)
      } catch (err) {
        setError('Failed to load courses')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // check if user has a roadmap for this course
  const hasRoadmap = (courseId) => {
    return roadmaps.some(r =>
      r.courseId?._id === courseId || r.courseId === courseId
    )
  }

  const handleCourseClick = async (course) => {
    // if already has roadmap → go to dashboard with courseId
    if (hasRoadmap(course._id)) {
      window.location.href = `/dashboard?courseId=${course._id}`
      return
    }

    // if enrolled but no roadmap → go to assessment
    if (course.isEnrolled) {
      window.location.href = `/assessment/${course._id}`
      return
    }

    // not enrolled → enroll first then go to assessment
    setEnrolling(course._id)
    try {
      await api.post('/enrollment/enroll',
        { courseId: course._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      window.location.href = `/assessment/${course._id}`
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
          Each course has its own personalised onboarding assessment.
        </p>

        {error && <p className="text-red-400 text-xs mb-6">{error}</p>}

        {courses.length === 0 ? (
          <div className="border border-white/8 rounded-sm p-8 text-center">
            <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">
              // no courses available yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {courses.map(course => {
              const alreadyHasRoadmap = hasRoadmap(course._id)
              const isLoading = enrolling === course._id

              return (
                <div
                  key={course._id}
                  className="border border-white/8 rounded-sm p-6 hover:border-white/20 transition-all"
                >
                  {/* status label */}
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-3">
                    {alreadyHasRoadmap
                      ? '// personalised roadmap ready'
                      : course.isEnrolled
                      ? '// assessment pending'
                      : '// course'}
                  </p>

                  {/* title */}
                  <h2 className="text-lg font-black text-white tracking-tight mb-2">
                    {course.title}
                  </h2>

                  {/* description */}
                  <p className="text-xs text-white/35 leading-relaxed mb-6">
                    {course.description}
                  </p>

                  {/* action button */}
                  <button
                    onClick={() => handleCourseClick(course)}
                    disabled={isLoading}
                    className="w-full bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40"
                  >
                    {isLoading
                      ? 'Enrolling...'
                      : alreadyHasRoadmap
                      ? 'View my roadmap →'
                      : course.isEnrolled
                      ? 'Continue assessment →'
                      : 'Start assessment →'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default CourseSelection