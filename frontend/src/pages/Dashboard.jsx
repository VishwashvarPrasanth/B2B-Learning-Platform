import { useState, useEffect } from 'react'
import api from '../services/api'

function Dashboard() {
  const [roadmap, setRoadmap] = useState(null)
  const [courses, setCourses] = useState([])
  const [profile, setProfile] = useState(null)
  const [watchStats, setWatchStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [error, setError] = useState('')

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchAll()
  }, [])

  // get courseId from URL if present
  const urlParams = new URLSearchParams(window.location.search)
  const courseIdFromUrl = urlParams.get('courseId')

  const fetchAll = async () => {
    try {
      const roadmapUrl = courseIdFromUrl
        ? `/roadmap?courseId=${courseIdFromUrl}`
        : '/roadmap/all'

      const [roadmapRes, coursesRes, profileRes, watchRes] = await Promise.all([
        api.get(roadmapUrl, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/enrollment', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get('/videos/my-stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      // handle both single roadmap and all roadmaps response
      if (courseIdFromUrl) {
        setRoadmap(roadmapRes.data.roadmap)
      } else {
        // show first roadmap if no courseId
        const allRoadmaps = roadmapRes.data.roadmaps
        setRoadmap(allRoadmaps?.[0] || null)
      }

      setCourses(coursesRes.data.courses)
      setProfile(profileRes.data)
      setWatchStats(watchRes.data)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = roadmap?.modules?.filter(m => m.completed).length || 0
  const totalCount = roadmap?.modules?.length || 0
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-white/30 text-xs font-bold tracking-[2px] uppercase">// loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* ── sidebar ── */}
      <div className="w-[180px] flex-shrink-0 border-r border-white/6 flex flex-col px-5 py-6 bg-[#060606]">
        <span className="font-black text-white text-sm tracking-tight mb-8">B2B Learn.</span>

        <nav className="flex flex-col gap-1 flex-1">
          {/* dashboard tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`text-left text-[10px] font-bold tracking-[1px] uppercase px-3 py-2 rounded-sm transition-colors ${
              activeTab === 'dashboard' ? 'text-white bg-white/6' : 'text-white/25 hover:text-white/50'
            }`}
          >
            Dashboard
          </button>

          {/* courses tab */}
          <button
            onClick={() => setActiveTab('courses')}
            className={`text-left text-[10px] font-bold tracking-[1px] uppercase px-3 py-2 rounded-sm transition-colors ${
              activeTab === 'courses' ? 'text-white bg-white/6' : 'text-white/25 hover:text-white/50'
            }`}
          >
            Courses
          </button>

          {/* profile tab */}
          <button
            onClick={() => setActiveTab('profile')}
            className={`text-left text-[10px] font-bold tracking-[1px] uppercase px-3 py-2 rounded-sm transition-colors ${
              activeTab === 'profile' ? 'text-white bg-white/6' : 'text-white/25 hover:text-white/50'
            }`}
          >
            Profile
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="text-[10px] font-bold tracking-[1px] uppercase text-white/20 px-3 py-2 text-left hover:text-white/40 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* ── main content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* top bar */}
        <div className="flex justify-between items-center px-8 py-4 border-b border-white/5">
          <div>
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-0.5">
              // {activeTab}
            </p>
            <p className="text-white font-bold text-sm">{user.name}</p>
          </div>
          <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="px-8 py-6">

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          {/* ══ DASHBOARD TAB ══ */}
          {activeTab === 'dashboard' && (
            <div>
              {/* stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="border border-white/8 rounded-sm p-4">
                  <div className="text-3xl font-black text-white mb-1">{progress}%</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Progress</div>
                </div>
                <div className="border border-white/8 rounded-sm p-4">
                  <div className="text-3xl font-black text-white mb-1">{watchStats?.totalWatchMinutes || 0}</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Minutes watched</div>
                </div>
                <div className="border border-white/8 rounded-sm p-4">
                  <div className="text-3xl font-black text-white mb-1">{watchStats?.completedVideos || 0}</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Videos done</div>
                </div>
              </div>

              {/* overall progress bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25">// overall progress</p>
                  <p className="text-[9px] font-bold text-white/40">{completedCount} / {totalCount}</p>
                </div>
                <div className="h-[2px] bg-white/8 rounded-sm">
                  <div
                    className="h-[2px] bg-white rounded-sm transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* ai generated roadmap */}
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">
                // ai-generated learning path
              </p>

              {roadmap?.modules?.map((module, index) => (
                <div
                  key={module._id}
                  onClick={() => {
                    const courseId = profile?.user?.onboardingCourseId
                    if (courseId) {
                      window.location.href = `/course/${courseId}?skill=${module.topic}`
                    }
                  }}
                  className={`flex items-center gap-4 border rounded-sm px-4 py-3.5 mb-3 transition-all cursor-pointer hover:border-white/25 ${
                    module.completed
                      ? 'border-white/15 bg-white/2'
                      : index === completedCount
                      ? 'border-white/30'
                      : 'border-white/6'
                  }`}
                >
                  {/* completion dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    module.completed ? 'bg-white' : index === completedCount ? 'bg-white/60' : 'bg-white/15'
                  }`} />

                  {/* module info */}
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${
                      module.completed ? 'text-white/50 line-through' : 'text-white'
                    }`}>
                      {module.topic}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">{module.reason}</p>
                  </div>

                  {/* level + status */}
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 border border-white/10 rounded-sm px-2 py-1">
                      {module.level}
                    </span>
                    {module.completed ? (
                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/50">done</span>
                    ) : index === completedCount ? (
                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white">→ next</span>
                    ) : (
                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/20">locked</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ COURSES TAB ══ */}
          {/* courses tab — click course to go to course selection */}
          {activeTab === 'courses' && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-6">
                // your courses
              </p>
              {courses.length === 0 ? (
                <div className="border border-white/6 rounded-sm p-8 text-center">
                  <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">
                    // no courses yet
                  </p>
                  
                    <a href="/courses"
                    className="text-white/40 text-xs mt-2 inline-block hover:text-white transition-colors"
                  >
                    Browse courses →
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {courses.map(course => (
                    <div
                      key={course._id}
                      className="border border-white/8 rounded-sm p-5 hover:border-white/20 transition-all cursor-pointer"
                      onClick={() => window.location.href = `/dashboard?courseId=${course._id}`}
                    >
                      <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-2">
                        // course
                      </p>
                      <h2 className="text-base font-black text-white tracking-tight mb-2">
                        {course.title}
                      </h2>
                      <p className="text-xs text-white/30 leading-relaxed mb-4">
                        {course.description}
                      </p>
                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white hover:text-white/70 transition-colors">
                        View roadmap →
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                
                  <a href="/courses"
                  className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors border border-white/10 rounded-sm px-4 py-2"
                >
                  + Explore more courses
                </a>
              </div>
            </div>
          )}

          {/* ══ PROFILE TAB ══ */}
          {activeTab === 'profile' && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-6">
                // profile
              </p>

              {/* user info */}
              <div className="border border-white/8 rounded-sm p-5 mb-6">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-4">// info</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Name</p>
                    <p className="text-white font-bold text-sm">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Email</p>
                    <p className="text-white font-bold text-sm">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Role</p>
                    <p className="text-white font-bold text-sm capitalize">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Status</p>
                    <p className="text-white font-bold text-sm">Active</p>
                  </div>
                </div>
              </div>

              {/* overall assessment score */}
              <div className="border border-white/8 rounded-sm p-5 mb-6">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-4">
                  // assessment results
                </p>

                {/* overall score ring */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <svg width="80" height="80" className="rotate-[-90deg]">
                      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 34}
                        strokeDashoffset={2 * Math.PI * 34 * (1 - (profile?.averageScore || 0) / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-black text-sm">{profile?.averageScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-2">
                      Overall score
                    </p>
                    <p className="text-white font-black text-2xl mb-1">{profile?.averageScore || 0}%</p>
                    <p className="text-white/30 text-xs">
                      {(profile?.averageScore || 0) >= 70
                        ? 'Strong foundation'
                        : (profile?.averageScore || 0) >= 40
                        ? 'Intermediate level'
                        : 'Beginner level'}
                    </p>
                  </div>
                </div>

                {/* per topic scores */}
                <div className="flex flex-col gap-4">
                  {Object.entries(profile?.assessmentScores || {}).map(([topic, score]) => (
                    <div key={topic}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/35">
                          {topic}
                        </span>
                        <span className="text-xs font-bold text-white">{score}%</span>
                      </div>
                      <div className="h-[2px] bg-white/8 rounded-sm">
                        <div
                          className="h-[2px] bg-white rounded-sm transition-all duration-500"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-white/20 mt-1">
                        {score >= 70 ? 'Strong — skipped in roadmap' : score >= 40 ? 'Intermediate — included' : 'Weak — prioritized in roadmap'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* watch stats */}
              <div className="border border-white/8 rounded-sm p-5">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-4">
                  // learning activity
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Watch time</p>
                    <p className="text-white font-black text-xl">{watchStats?.totalWatchMinutes || 0} min</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Videos done</p>
                    <p className="text-white font-black text-xl">{watchStats?.completedVideos || 0}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Started</p>
                    <p className="text-white font-black text-xl">{watchStats?.totalModulesStarted || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Dashboard