import { useState, useEffect } from 'react'
import api from '../services/api'

function AdminDashboard() {
  // ── state ──
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userProgress, setUserProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [uploadingModule, setUploadingModule] = useState(null)
  const [assessmentCourse, setAssessmentCourse] = useState(null)
  const [questionForm, setQuestionForm] = useState({
  question: '', option1: '', option2: '', option3: '', option4: '',
  correctAnswer: '', topic: '', difficulty: 'easy' })

  // course form state
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '' })
  const [creating, setCreating] = useState(false)

  // module form state
  const [showModuleForm, setShowModuleForm] = useState(null) // courseId
  const [moduleForm, setModuleForm] = useState({
    title: '', description: '', contentUrl: '',
    duration: '', order: '', skillTag: '', difficulty: 'beginner'
  })
  const [addingModule, setAddingModule] = useState(false)

  // edit course state
  const [editingCourse, setEditingCourse] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '' })

  // edit module state
  const [editingModule, setEditingModule] = useState(null)
  const [editModuleForm, setEditModuleForm] = useState({
    title: '', description: '', contentUrl: '',
    duration: '', order: '', skillTag: '', difficulty: 'beginner'
  })
  const [updatingModule, setUpdatingModule] = useState(false)

  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  // ── redirect if not admin ──
  useEffect(() => {
    if (user.role !== 'admin') {
      window.location.href = '/dashboard'
      return
    }
    fetchAll()
  }, [])

  // ── fetch all data ──
    const fetchAll = async () => {
      try {
        const [statsRes, coursesRes, usersRes] = await Promise.all([
          api.get('/admin/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/courses', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          api.get('/admin/users', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        setStats(statsRes.data)
        setUsers(usersRes.data.users)

        // fetch modules for each course
        const coursesWithModules = await Promise.all(
          coursesRes.data.courses.map(async (course) => {
            const courseRes = await api.get(`/courses/${course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            return {
              ...course,
              modules: courseRes.data.modules
            }
          })
        )

        setCourses(coursesWithModules)
      } catch (err) {
        setError('Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

  // ── create course ──
  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.post('/courses', courseForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Course created successfully')
      setCourseForm({ title: '', description: '' })
      setShowCourseForm(false)
      fetchAll()
    } catch (err) {
      setError('Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  // ── delete course ──
  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course and all its modules?')) return
    try {
      await api.delete(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Course deleted')
      fetchAll()
    } catch (err) {
      setError('Failed to delete course')
    }
  }

  // ── update course ──
  const handleUpdateCourse = async (courseId) => {
    try {
      await api.put(`/courses/${courseId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Course updated')
      setEditingCourse(null)
      fetchAll()
    } catch (err) {
      setError('Failed to update course')
    }
  }

  // ── toggle publish ──
  const handleTogglePublish = async (course) => {
    try {
      await api.put(`/courses/${course._id}`,
        { ...course, isPublished: !course.isPublished },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showSuccess(course.isPublished ? 'Course unpublished' : 'Course published')
      fetchAll()
    } catch (err) {
      setError('Failed to update course')
    }
  }

  // ── add module ──
  const handleAddModule = async (e, courseId) => {
    e.preventDefault()
    setAddingModule(true)
    try {
      await api.post(`/courses/${courseId}/modules`, moduleForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Module added successfully')
      setModuleForm({
        title: '', description: '', contentUrl: '',
        duration: '', order: '', skillTag: '', difficulty: 'beginner'
      })
      setShowModuleForm(null)
      fetchAll()
    } catch (err) {
      setError('Failed to add module')
    } finally {
      setAddingModule(false)
    }
  }
  // ── upload video to module ──
const handleVideoUpload = async (moduleId, file) => {
  setUploadingModule(moduleId)
  try {
    const formData = new FormData()
    formData.append('video', file)

    await api.post(`/videos/upload/${moduleId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    showSuccess('Video uploaded successfully')
    fetchAll()
  } catch (err) {
    setError('Video upload failed')
  } finally {
    setUploadingModule(null)
  }
}

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module?')) return
    try {
      await api.delete(`/courses/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Module deleted')
      fetchAll()
    } catch (err) {
      setError('Failed to delete module')
    }
  }

  // ── edit module handlers ──
  const startEditModule = (module) => {
    setEditingModule(module._id)
    setEditModuleForm({
      title: module.title || '',
      description: module.description || '',
      contentUrl: module.contentUrl || '',
      duration: module.duration ?? '',
      order: module.order ?? '',
      skillTag: module.skillTag || '',
      difficulty: module.difficulty || 'beginner'
    })
  }

  const handleUpdateModule = async (e, moduleId) => {
    e.preventDefault()
    setUpdatingModule(true)
    try {
      await api.put(`/courses/modules/${moduleId}`, editModuleForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showSuccess('Module updated successfully')
      setEditingModule(null)
      fetchAll()
    } catch (err) {
      setError('Failed to update module')
    } finally {
      setUpdatingModule(false)
    }
  }

  // ── create assessment question for a course ──
    const handleCreateQuestion = async (e, courseId) => {
      e.preventDefault()
      try {
        const options = [
          questionForm.option1,
          questionForm.option2,
          questionForm.option3,
          questionForm.option4
        ].filter(Boolean)

        await api.post(`/assessment/course/${courseId}/questions`, {
          question: questionForm.question,
          options,
          correctAnswer: questionForm.correctAnswer,
          topic: questionForm.topic,
          difficulty: questionForm.difficulty
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        showSuccess('Question added')
        setQuestionForm({
          question: '', option1: '', option2: '',
          option3: '', option4: '', correctAnswer: '', topic: '', difficulty: 'easy'
        })
        setAssessmentCourse(null)
      } catch (err) {
        setError('Failed to add question')
      }
    }


  // ── fetch user progress ──
  const handleViewUserProgress = async (userId) => {
    setSelectedUser(userId)
    try {
      const res = await api.get(`/admin/users/${userId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUserProgress(res.data)
    } catch (err) {
      setError('Failed to fetch user progress')
    }
  }

  // ── helper ──
  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleLogout = () => {
    localStorage.clear()
    window.location.href = '/login'
  }

  // ── circular progress component ──
  const CircularProgress = ({ percentage, size = 80 }) => {
    const radius = (size - 10) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        {/* progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
    )
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
        <span className="font-black text-white text-sm tracking-tight mb-1">B2B Learn.</span>
        <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-8">Admin</span>

        <nav className="flex flex-col gap-1 flex-1">
          {['overview', 'users', 'courses'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-left text-[10px] font-bold tracking-[1px] uppercase px-3 py-2 rounded-sm transition-colors ${
                activeTab === tab ? 'text-white bg-white/6' : 'text-white/25 hover:text-white/50'
              }`}
            >
              {tab}
            </button>
          ))}
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
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-0.5">// {activeTab}</p>
            <p className="text-white font-bold text-sm">{user.name}</p>
          </div>
          {activeTab === 'courses' && (
            <button
              onClick={() => setShowCourseForm(!showCourseForm)}
              className="bg-white text-black font-bold text-xs px-4 py-2 rounded-sm hover:bg-white/90 transition-colors"
            >
              + New course
            </button>
          )}
        </div>

        <div className="px-8 py-6">

          {/* messages */}
          {error && (
            <p className="text-red-400 text-xs mb-4 font-bold">{error}</p>
          )}
          {successMsg && (
            <p className="text-green-400 text-xs mb-4 font-bold">✓ {successMsg}</p>
          )}

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === 'overview' && (
            <div>
              {/* stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="border border-white/8 rounded-sm p-5">
                  <div className="text-4xl font-black text-white mb-1">{stats?.totalUsers || 0}</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Total users</div>
                </div>
                <div className="border border-white/8 rounded-sm p-5">
                  <div className="text-4xl font-black text-white mb-1">{stats?.totalCourses || 0}</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Courses</div>
                </div>
                <div className="border border-white/8 rounded-sm p-5">
                  <div className="text-4xl font-black text-white mb-1">{stats?.totalModules || 0}</div>
                  <div className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Modules</div>
                </div>
              </div>

              {/* weekly report */}
              {stats?.recentStats ? (
                <div className="border border-white/8 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">// last weekly report</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Avg progress</p>
                      <p className="text-white font-black text-2xl">{stats.recentStats.avgProgress}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Active users</p>
                      <p className="text-white font-black text-2xl">{stats.recentStats.totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Report date</p>
                      <p className="text-white font-black text-sm">
                        {new Date(stats.recentStats.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-white/6 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-1">// weekly report</p>
                  <p className="text-white/20 text-xs">Cron job runs every Monday 7AM — no report yet.</p>
                </div>
              )}
            </div>
          )}

          {/* ══ USERS TAB ══ */}
          {/* ══ USERS TAB ══ */}
          {activeTab === 'users'  && (
            <div>
              {(() => {
                const regularUsers = users.filter(u => u.role !== 'admin');
                return (
                  <>
                    <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">
                      // {regularUsers.length} registered users
                    </p>

                    <div className="flex flex-col gap-3">
                      {regularUsers.map(u => (
                   <div key={u._id} className="border border-white/8 rounded-sm p-4">

                    {/* user info row */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-bold text-sm">{u.name}</p>
                        <p className="text-white/30 text-xs">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold tracking-[1px] uppercase border border-white/15 text-white/40 rounded-sm px-2 py-1">
                          {u.role}
                        </span>
                        <button
                          onClick={() => handleViewUserProgress(u._id)}
                          className="text-[9px] font-bold tracking-[1px] uppercase text-white/40 hover:text-white transition-colors"
                        >
                          View progress →
                        </button>
                      </div>
                    </div>

                    {/* progress panel - shows when selected */}
                    {selectedUser === u._id && userProgress && (
                      <div className="border-t border-white/6 pt-4 mt-2">
                        <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-4">
                          // progress report
                        </p>

                        {/* overall progress card with circular ring */}
                        <div className="border border-white/8 rounded-sm p-4 mb-4 flex items-center gap-6">
                          {/* circular progress ring */}
                          <div className="relative flex-shrink-0">
                            <CircularProgress percentage={userProgress.percentage} size={80} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-white font-black text-sm">
                                {userProgress.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* progress details */}
                          <div>
                            <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-2">
                              Overall Progress
                            </p>
                            <p className="text-white font-black text-2xl mb-1">
                              {userProgress.completedModules}
                              <span className="text-white/30 text-sm font-normal"> / {userProgress.totalModules} modules</span>
                            </p>
                            <p className="text-white/30 text-xs">
                              {userProgress.totalModules - userProgress.completedModules} modules remaining
                            </p>
                          </div>
                        </div>

                        {/* completed modules list */}
                        {userProgress.progressRecords.length > 0 ? (
                          <div>
                            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-3">
                              // completed modules
                            </p>
                            <div className="flex flex-col gap-2">
                              {userProgress.progressRecords.map(record => (
                                <div
                                  key={record._id}
                                  className="flex items-center justify-between border border-white/6 rounded-sm px-3 py-2"
                                >
                                  <div className="flex items-center gap-3">
                                    {/* completion dot */}
                                    <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />
                                    <p className="text-white text-xs font-bold">
                                      {record.moduleId?.title || 'Module'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/25">
                                      {record.moduleId?.skillTag}
                                    </span>
                                    <span className="text-[9px] text-white/20">
                                      {new Date(record.completedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">
                            // no modules completed yet
                          </p>
                        )}

                        {/* close button */}
                        <button
                          onClick={() => { setSelectedUser(null); setUserProgress(null) }}
                          className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 hover:text-white/40 transition-colors mt-4"
                        >
                          Close ✕
                        </button>
                      </div>
                    )}
                  </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ══ COURSES TAB ══ */}
          {activeTab === 'courses' && (
            <div>

              {/* create course form */}
              {showCourseForm && (
                <div className="border border-white/10 rounded-sm p-5 mb-6">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">// create course</p>
                  <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                    <div>
                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">Title</p>
                      <input
                        type="text"
                        value={courseForm.title}
                        onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                        placeholder="e.g. Web Development Bootcamp"
                        required
                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder-white/20"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1.5">Description</p>
                      <textarea
                        value={courseForm.description}
                        onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                        placeholder="What will learners get from this course?"
                        required
                        rows={3}
                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2.5 text-white text-sm outline-none focus:border-white/30 transition-colors placeholder-white/20 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={creating}
                        className="bg-white text-black font-bold text-sm px-5 py-2 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40"
                      >
                        {creating ? 'Creating...' : 'Create →'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCourseForm(false)}
                        className="border border-white/20 text-white/50 text-sm px-5 py-2 rounded-sm hover:border-white/40 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* courses list */}
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">
                // {courses.length} courses
              </p>

              <div className="flex flex-col gap-4">
                {courses.length === 0 ? (
                  <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">// no courses yet</p>
                ) : (
                  courses.map(course => (
                    <div key={course._id} className="border border-white/8 rounded-sm p-5">

                      {/* course header */}
                      {editingCourse === course._id ? (
                        // edit form
                        <div className="mb-4">
                          <input
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-sm outline-none mb-2 focus:border-white/30"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            rows={2}
                            className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-sm outline-none resize-none focus:border-white/30"
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleUpdateCourse(course._id)}
                              className="bg-white text-black font-bold text-xs px-4 py-1.5 rounded-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingCourse(null)}
                              className="border border-white/20 text-white/50 text-xs px-4 py-1.5 rounded-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // course info
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-white font-bold text-sm mb-1">{course.title}</p>
                            <p className="text-white/30 text-xs">{course.description}</p>
                          </div>
                          {/* course actions */}
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <button
                              onClick={() => handleTogglePublish(course)}
                              className={`text-[9px] font-bold tracking-[1px] uppercase border rounded-sm px-2 py-1 transition-colors ${
                                course.isPublished
                                  ? 'border-white/30 text-white/60 hover:border-red-400 hover:text-red-400'
                                  : 'border-white/10 text-white/20 hover:border-white/30 hover:text-white/50'
                              }`}
                            >
                              {course.isPublished ? 'Published' : 'Draft'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCourse(course._id)
                                setEditForm({ title: course.title, description: course.description })
                              }}
                              className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(course._id)}
                              className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* modules section */}
                      <div className="border-t border-white/6 pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20">// modules</p>
                          <button
                            onClick={() => setShowModuleForm(showModuleForm === course._id ? null : course._id)}
                            className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors"
                          >
                            + Add module
                          </button>
                        </div>

                        {/* add module form */}
                        {showModuleForm === course._id && (
                          <form
                            onSubmit={(e) => handleAddModule(e, course._id)}
                            className="border border-white/8 rounded-sm p-4 mb-4 grid grid-cols-2 gap-3"
                          >
                            <div className="col-span-2">
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Title</p>
                              <input
                                value={moduleForm.title}
                                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                placeholder="Module title"
                                required
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Description</p>
                              <input
                                value={moduleForm.description}
                                onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                                placeholder="What this module covers"
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div className="col-span-2">
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Video URL</p>
                              <input
                                value={moduleForm.contentUrl}
                                onChange={e => setModuleForm({ ...moduleForm, contentUrl: e.target.value })}
                                placeholder="https://youtube.com/embed/..."
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Skill Tag</p>
                              <input
                                value={moduleForm.skillTag}
                                onChange={e => setModuleForm({ ...moduleForm, skillTag: e.target.value })}
                                placeholder="e.g. JavaScript"
                                required
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Order</p>
                              <input
                                type="number"
                                value={moduleForm.order}
                                onChange={e => setModuleForm({ ...moduleForm, order: e.target.value })}
                                placeholder="1"
                                required
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Duration (min)</p>
                              <input
                                type="number"
                                value={moduleForm.duration}
                                onChange={e => setModuleForm({ ...moduleForm, duration: e.target.value })}
                                placeholder="60"
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Difficulty</p>
                              <select
                                value={moduleForm.difficulty}
                                onChange={e => setModuleForm({ ...moduleForm, difficulty: e.target.value })}
                                className="w-full bg-[#080808] border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25"
                              >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                              </select>
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <button
                                type="submit"
                                disabled={addingModule}
                                className="bg-white text-black font-bold text-xs px-4 py-2 rounded-sm disabled:opacity-40"
                              >
                                {addingModule ? 'Adding...' : 'Add module →'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowModuleForm(null)}
                                className="border border-white/20 text-white/40 text-xs px-4 py-2 rounded-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {/* modules list with edit & upload */}
                        {courses
                          .find(c => c._id === course._id)
                          ?.modules?.map(module => (
                            <div key={module._id} className="mb-2">
                              {editingModule === module._id ? (
                                // ── Edit Module Form ──
                                <form
                                  onSubmit={(e) => handleUpdateModule(e, module._id)}
                                  className="border border-white/15 rounded-sm p-4 bg-white/2 flex flex-col gap-3"
                                >
                                  <div className="flex justify-between items-center pb-2 border-b border-white/6">
                                    <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/40">
                                      // Edit module
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => setEditingModule(null)}
                                      className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors"
                                    >
                                      ✕ Close
                                    </button>
                                  </div>

                                  <div>
                                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Title</p>
                                    <input
                                      value={editModuleForm.title}
                                      onChange={e => setEditModuleForm({ ...editModuleForm, title: e.target.value })}
                                      placeholder="Module title"
                                      required
                                      className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30"
                                    />
                                  </div>

                                  <div>
                                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Description</p>
                                    <textarea
                                      value={editModuleForm.description}
                                      onChange={e => setEditModuleForm({ ...editModuleForm, description: e.target.value })}
                                      placeholder="What this module covers"
                                      rows={2}
                                      className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30 resize-none"
                                    />
                                  </div>

                                  {/* Video inspection & update */}
                                  <div className="border border-white/8 rounded-sm p-3 bg-black/40">
                                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-2">Video Inspection</p>
                                    
                                    {module.contentUrl ? (
                                      <div className="flex flex-col gap-2 mb-3">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] text-green-400 font-bold">
                                            ✓ Video Uploaded ({module.duration || 0} min)
                                          </span>
                                          <a
                                            href={module.contentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] font-bold tracking-[1px] uppercase text-white/40 hover:text-white underline transition-colors"
                                          >
                                            Preview Video ↗
                                          </a>
                                        </div>
                                        <video
                                          src={module.contentUrl}
                                          controls
                                          className="w-full max-h-48 rounded-sm bg-black border border-white/10"
                                        />
                                      </div>
                                    ) : (
                                      <p className="text-white/20 text-[10px] uppercase font-bold tracking-[1px] mb-2">
                                        No video uploaded yet
                                      </p>
                                    )}

                                    <div className="flex flex-col gap-2">
                                      <div>
                                        <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 mb-1">Video URL</p>
                                        <input
                                          value={editModuleForm.contentUrl}
                                          onChange={e => setEditModuleForm({ ...editModuleForm, contentUrl: e.target.value })}
                                          placeholder="https://... or upload new file below"
                                          className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-1.5 text-white text-xs outline-none focus:border-white/30"
                                        />
                                      </div>
                                      
                                      <div className="flex items-center gap-2 mt-1">
                                        <label className="cursor-pointer">
                                          <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/40 hover:text-white transition-colors border border-white/15 rounded-sm px-3 py-1.5 inline-block">
                                            {uploadingModule === module._id ? 'Uploading...' : '↑ Upload New Video File'}
                                          </span>
                                          <input
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                              if (e.target.files[0]) {
                                                await handleVideoUpload(module._id, e.target.files[0])
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Skill Tag</p>
                                      <input
                                        value={editModuleForm.skillTag}
                                        onChange={e => setEditModuleForm({ ...editModuleForm, skillTag: e.target.value })}
                                        placeholder="e.g. JavaScript"
                                        required
                                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Order</p>
                                      <input
                                        type="number"
                                        value={editModuleForm.order}
                                        onChange={e => setEditModuleForm({ ...editModuleForm, order: e.target.value })}
                                        required
                                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Duration (min)</p>
                                      <input
                                        type="number"
                                        value={editModuleForm.duration}
                                        onChange={e => setEditModuleForm({ ...editModuleForm, duration: e.target.value })}
                                        placeholder="60"
                                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30"
                                      />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Difficulty</p>
                                      <select
                                        value={editModuleForm.difficulty}
                                        onChange={e => setEditModuleForm({ ...editModuleForm, difficulty: e.target.value })}
                                        className="w-full bg-[#080808] border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/30"
                                      >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-2 border-t border-white/6">
                                    <button
                                      type="submit"
                                      disabled={updatingModule}
                                      className="bg-white text-black font-bold text-xs px-4 py-2 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40"
                                    >
                                      {updatingModule ? 'Saving...' : 'Save changes →'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingModule(null)}
                                      className="border border-white/20 text-white/40 text-xs px-4 py-2 rounded-sm hover:border-white/40 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                // ── Normal Module Row ──
                                <div className="flex items-center justify-between border border-white/6 rounded-sm px-3 py-2.5">
                                  <div>
                                    <p className="text-white text-xs font-bold">{module.title}</p>
                                    <p className="text-white/25 text-[10px]">{module.skillTag} · {module.difficulty} · #{module.order}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {/* video status */}
                                    {module.contentUrl ? (
                                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/40">
                                        ✓ video ready · {module.duration}min
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/20">
                                        no video
                                      </span>
                                    )}

                                    {/* upload button */}
                                    <label className="cursor-pointer">
                                      <span className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors border border-white/10 rounded-sm px-3 py-1.5">
                                        {uploadingModule === module._id ? 'Uploading...' : '↑ Upload'}
                                      </span>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files[0]) {
                                            handleVideoUpload(module._id, e.target.files[0])
                                          }
                                        }}
                                      />
                                    </label>

                                    {/* edit module button */}
                                    <button
                                      onClick={() => startEditModule(module)}
                                      className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors border border-white/10 rounded-sm px-3 py-1.5"
                                    >
                                      Edit
                                    </button>

                                    {/* quiz manager toggle */}
                                    <ModuleQuizToggle moduleId={module._id} moduleTitle={module.title} token={token} />

                                    {/* delete module */}
                                    <button
                                      onClick={() => handleDeleteModule(module._id)}
                                      className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 hover:text-red-400 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        }
                      </div>


                      {/* ── ADD ASSESSMENT SECTION HERE ── */}
                      <div className="border-t border-white/6 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20">
                            // onboarding assessment
                          </p>
                          <button
                            onClick={() => setAssessmentCourse(
                              assessmentCourse === course._id ? null : course._id
                            )}
                            className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors"
                          >
                            + Add question
                          </button>
                        </div>

                        {/* add question form */}
                        {assessmentCourse === course._id && (
                          <form
                            onSubmit={(e) => handleCreateQuestion(e, course._id)}
                            className="border border-white/8 rounded-sm p-4 mb-4 flex flex-col gap-3"
                          >
                            <div>
                              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Question</p>
                              <input
                                value={questionForm.question}
                                onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                                placeholder="Type the question"
                                required
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {['option1', 'option2', 'option3', 'option4'].map((key, i) => (
                                <div key={key}>
                                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">
                                    Option {i + 1}
                                  </p>
                                  <input
                                    value={questionForm[key]}
                                    onChange={e => setQuestionForm({ ...questionForm, [key]: e.target.value })}
                                    placeholder={`Option ${i + 1}`}
                                    required
                                    className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                                  />
                                </div>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Correct Answer</p>
                                <select
                                  value={questionForm.correctAnswer}
                                  onChange={e => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                                  required
                                  className="w-full bg-[#080808] border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none"
                                >
                                  <option value="">Select correct</option>
                                  {['option1', 'option2', 'option3', 'option4'].map((key, i) => (
                                    questionForm[key] && (
                                      <option key={key} value={questionForm[key]}>
                                        Option {i + 1}: {questionForm[key].slice(0, 25)}
                                      </option>
                                    )
                                  ))}
                                </select>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Topic</p>
                                <input
                                  value={questionForm.topic}
                                  onChange={e => setQuestionForm({ ...questionForm, topic: e.target.value })}
                                  placeholder="e.g. JavaScript"
                                  required
                                  className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                                />
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                className="bg-white text-black font-bold text-xs px-4 py-2 rounded-sm"
                              >
                                Add question →
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssessmentCourse(null)}
                                className="border border-white/20 text-white/40 text-xs px-4 py-2 rounded-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {/* questions list */}
                        <AssessmentQuestions courseId={course._id} token={token} />
                      </div>
                      {/* ── END ASSESSMENT SECTION ── */}

                    </div>
                  ))
                )}
                </div>
              {/* </div> */}
            </div>
          )}

          {/* ══ ANALYTICS TAB ══ */}
          {activeTab === 'analytics' && (
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-6">// platform analytics</p>

              {/* metrics grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="border border-white/8 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-3">// total users</p>
                  <p className="text-5xl font-black text-white">{stats?.totalUsers || 0}</p>
                </div>
                <div className="border border-white/8 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-3">// total courses</p>
                  <p className="text-5xl font-black text-white">{stats?.totalCourses || 0}</p>
                </div>
                <div className="border border-white/8 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-3">// total modules</p>
                  <p className="text-5xl font-black text-white">{stats?.totalModules || 0}</p>
                </div>
                <div className="border border-white/8 rounded-sm p-5">
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-3">// weekly cron</p>
                  <p className="text-white/20 text-xs mt-2 leading-relaxed">
                    {stats?.recentStats
                      ? `Last run: ${new Date(stats.recentStats.date).toLocaleDateString()}`
                      : 'Runs every Monday 7AM automatically'}
                  </p>
                </div>
              </div>

              {/* drop off info */}
              <div className="border border-white/6 rounded-sm p-5">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-3">// automated reports</p>
                <p className="text-white/30 text-xs leading-relaxed">
                  Weekly stats are calculated every Monday at 7AM using node-cron.
                  The job counts active users, total courses, and calculates average
                  progress. Results stored in DailyStats collection in MongoDB.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function AssessmentQuestions({ courseId, token }) {
  const [questions, setQuestions] = useState([])
  const [editingQ, setEditingQ] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/assessment/course/${courseId}/questions/all`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setQuestions(res.data.questions)
      } catch (err) {}
    }
    fetch()
  }, [courseId])

  const handleDelete = async (questionId) => {
    if (!confirm('Delete this question?')) return
    try {
      await api.delete(`/assessment/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuestions(questions.filter(q => q._id !== questionId))
    } catch (err) {}
  }

  const handleUpdate = async (questionId) => {
    try {
      await api.put(`/assessment/questions/${questionId}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuestions(questions.map(q => q._id === questionId ? { ...q, ...editForm } : q))
      setEditingQ(null)
    } catch (err) {}
  }

  if (questions.length === 0) {
    return (
      <p className="text-white/15 text-[10px] font-bold tracking-[2px] uppercase">
        // no questions yet
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => (
        <div key={q._id} className="border border-white/6 rounded-sm px-3 py-2.5">
          {editingQ === q._id ? (
            <div className="flex flex-col gap-2">
              <input
                value={editForm.question}
                onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                className="w-full bg-white/4 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none"
              />
              <input
                value={editForm.correctAnswer}
                onChange={e => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                placeholder="Correct answer"
                className="w-full bg-white/4 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(q._id)}
                  className="bg-white text-black font-bold text-[10px] px-3 py-1 rounded-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingQ(null)}
                  className="border border-white/15 text-white/30 text-[10px] px-3 py-1 rounded-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-white/20 text-[9px] font-bold tracking-[1px] uppercase mb-1">
                  Q{i + 1} · {q.topic}
                </p>
                <p className="text-white text-xs font-bold leading-relaxed">
                  {q.question}
                </p>
                <p className="text-white/25 text-[10px] mt-1">
                  ✓ {q.correctAnswer}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingQ(q._id)
                    setEditForm({ question: q.question, correctAnswer: q.correctAnswer })
                  }}
                  className="text-[9px] font-bold tracking-[1px] uppercase text-white/25 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(q._id)}
                  className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 hover:text-red-400 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// ModuleQuizToggle — inline quiz manager per module
// Admins can create / edit / delete quiz questions for
// a specific module directly from the courses tab.
// ─────────────────────────────────────────────────────────
function ModuleQuizToggle({ moduleId, moduleTitle, token }) {
  const [open, setOpen] = useState(false)
  const [quiz, setQuiz] = useState(null)       // existing quiz (if any)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [editingIdx, setEditingIdx] = useState(null)

  // new-question form
  const emptyQ = { question: '', option1: '', option2: '', option3: '', option4: '', correctAnswer: '', explanation: '' }
  const [qForm, setQForm] = useState(emptyQ)
  const [showAddForm, setShowAddForm] = useState(false)

  // edit-question form
  const [editQForm, setEditQForm] = useState({})

  // quiz-level settings
  const [settingsForm, setSettingsForm] = useState({ title: '', passingScore: 60 })
  const [showSettings, setShowSettings] = useState(false)

  // ── fetch quiz when panel opens ──
  useEffect(() => {
    if (!open) return
    fetchQuiz()
  }, [open])

  const fetchQuiz = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/quiz/module/${moduleId}/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuiz(res.data.quiz)
      setSettingsForm({
        title: res.data.quiz.title,
        passingScore: res.data.quiz.passingScore
      })
    } catch (err) {
      // 404 = no quiz yet — that's fine
      setQuiz(null)
      setSettingsForm({ title: `${moduleTitle} Quiz`, passingScore: 60 })
    } finally {
      setLoading(false)
    }
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  // ── add question ──
  const handleAddQuestion = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const options = [qForm.option1, qForm.option2, qForm.option3, qForm.option4].filter(Boolean)
      await api.post(`/quiz/module/${moduleId}/questions`, {
        question: qForm.question,
        options,
        correctAnswer: qForm.correctAnswer,
        explanation: qForm.explanation
      }, { headers: { Authorization: `Bearer ${token}` } })
      flash('Question added')
      setQForm(emptyQ)
      setShowAddForm(false)
      fetchQuiz()
    } catch (err) {
      flash('Failed to add question')
    } finally {
      setSaving(false)
    }
  }

  // ── update question ──
  const handleUpdateQuestion = async (idx) => {
    try {
      const options = [editQForm.option1, editQForm.option2, editQForm.option3, editQForm.option4].filter(Boolean)
      await api.put(`/quiz/module/${moduleId}/questions/${idx}`, {
        question: editQForm.question,
        options,
        correctAnswer: editQForm.correctAnswer,
        explanation: editQForm.explanation
      }, { headers: { Authorization: `Bearer ${token}` } })
      flash('Question updated')
      setEditingIdx(null)
      fetchQuiz()
    } catch (err) {
      flash('Failed to update')
    }
  }

  // ── delete question ──
  const handleDeleteQuestion = async (idx) => {
    if (!confirm('Delete this question?')) return
    try {
      await api.delete(`/quiz/module/${moduleId}/questions/${idx}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      flash('Question deleted')
      fetchQuiz()
    } catch (err) {
      flash('Failed to delete')
    }
  }

  // ── delete entire quiz ──
  const handleDeleteQuiz = async () => {
    if (!confirm('Delete entire quiz for this module?')) return
    try {
      await api.delete(`/quiz/module/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      flash('Quiz deleted')
      setQuiz(null)
    } catch (err) {
      flash('Failed to delete quiz')
    }
  }

  // ── save quiz settings ──
  const handleSaveSettings = async () => {
    try {
      await api.patch(`/quiz/module/${moduleId}/settings`, {
        title: settingsForm.title,
        passingScore: parseInt(settingsForm.passingScore)
      }, { headers: { Authorization: `Bearer ${token}` } })
      flash('Settings saved')
      setShowSettings(false)
      fetchQuiz()
    } catch (err) {
      flash('Failed to save settings')
    }
  }

  const openEdit = (idx, q) => {
    setEditingIdx(idx)
    setEditQForm({
      question: q.question,
      option1: q.options[0] || '',
      option2: q.options[1] || '',
      option3: q.options[2] || '',
      option4: q.options[3] || '',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    })
  }

  return (
    <div className="w-full">
      {/* toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={`text-[9px] font-bold tracking-[1px] uppercase border rounded-sm px-3 py-1.5 transition-colors ${
          open
            ? 'border-white/30 text-white bg-white/6'
            : quiz !== null
              ? 'border-white/15 text-white/40 hover:border-white/30'
              : 'border-white/8 text-white/25 hover:border-white/20'
        }`}
      >
        {quiz ? `✓ Quiz (${quiz?.questions?.length || 0})` : '+ Quiz'}
      </button>

      {/* panel */}
      {open && (
        <div className="mt-2 border border-white/10 rounded-sm overflow-hidden">

          {/* panel header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/2 border-b border-white/8">
            <div>
              <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/30">
                // quiz for: {moduleTitle}
              </p>
              {quiz && (
                <p className="text-white/20 text-[9px] mt-0.5">
                  {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''} · pass {quiz.passingScore}%
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {msg && <span className="text-[9px] text-green-400 font-bold">{msg}</span>}
              {quiz && (
                <>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-[9px] font-bold tracking-[1px] uppercase text-white/25 hover:text-white transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleDeleteQuiz}
                    className="text-[9px] font-bold tracking-[1px] uppercase text-white/15 hover:text-red-400 transition-colors"
                  >
                    Delete quiz
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-4">

            {loading && (
              <p className="text-white/20 text-[10px] font-bold tracking-[2px] uppercase">// loading...</p>
            )}

            {/* ── quiz settings ── */}
            {showSettings && quiz && (
              <div className="border border-white/8 rounded-sm p-3 mb-4 flex flex-col gap-2">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-1">// quiz settings</p>
                <div>
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Quiz Title</p>
                  <input
                    value={settingsForm.title}
                    onChange={e => setSettingsForm({ ...settingsForm, title: e.target.value })}
                    className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25"
                  />
                </div>
                <div>
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Passing Score (%)</p>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settingsForm.passingScore}
                    onChange={e => setSettingsForm({ ...settingsForm, passingScore: e.target.value })}
                    className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveSettings}
                    className="bg-white text-black font-bold text-[10px] px-4 py-1.5 rounded-sm"
                  >
                    Save settings
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="border border-white/15 text-white/30 text-[10px] px-4 py-1.5 rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── existing questions list ── */}
            {quiz && quiz.questions.length > 0 && (
              <div className="flex flex-col gap-2 mb-4">
                {quiz.questions.map((q, idx) => (
                  <div key={idx} className="border border-white/8 rounded-sm px-3 py-2.5">
                    {editingIdx === idx ? (
                      // ── edit form ──
                      <div className="flex flex-col gap-2">
                        <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25">Question</p>
                        <input
                          value={editQForm.question}
                          onChange={e => setEditQForm({ ...editQForm, question: e.target.value })}
                          className="w-full bg-white/4 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {['option1','option2','option3','option4'].map((k, i) => (
                            <div key={k}>
                              <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/15 mb-1">Option {i+1}</p>
                              <input
                                value={editQForm[k]}
                                onChange={e => setEditQForm({ ...editQForm, [k]: e.target.value })}
                                className="w-full bg-white/4 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/15 mb-1">Correct Answer</p>
                            <select
                              value={editQForm.correctAnswer}
                              onChange={e => setEditQForm({ ...editQForm, correctAnswer: e.target.value })}
                              className="w-full bg-[#080808] border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none"
                            >
                              <option value="">Select correct</option>
                              {['option1','option2','option3','option4'].map((k,i) => (
                                editQForm[k] && <option key={k} value={editQForm[k]}>Opt {i+1}: {editQForm[k].slice(0,20)}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/15 mb-1">Explanation (optional)</p>
                            <input
                              value={editQForm.explanation}
                              onChange={e => setEditQForm({ ...editQForm, explanation: e.target.value })}
                              placeholder="Why this is correct"
                              className="w-full bg-white/4 border border-white/10 rounded-sm px-2 py-1.5 text-white text-xs outline-none placeholder-white/10"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateQuestion(idx)}
                            className="bg-white text-black font-bold text-[10px] px-3 py-1.5 rounded-sm"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => setEditingIdx(null)}
                            className="border border-white/15 text-white/30 text-[10px] px-3 py-1.5 rounded-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // ── view row ──
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-white/20 text-[9px] font-bold tracking-[1px] uppercase mb-1">Q{idx + 1}</p>
                          <p className="text-white text-xs font-bold leading-relaxed">{q.question}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {q.options.map((opt, oi) => (
                              <span
                                key={oi}
                                className={`text-[9px] ${opt === q.correctAnswer ? 'text-white font-bold' : 'text-white/25'}`}
                              >
                                {String.fromCharCode(65+oi)}. {opt}
                                {opt === q.correctAnswer && ' ✓'}
                              </span>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-white/20 text-[9px] italic mt-1">{q.explanation}</p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => openEdit(idx, q)}
                            className="text-[9px] font-bold tracking-[1px] uppercase text-white/25 hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(idx)}
                            className="text-[9px] font-bold tracking-[1px] uppercase text-white/15 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && !quiz && (
              <p className="text-white/15 text-[10px] font-bold tracking-[2px] uppercase mb-3">
                // no quiz yet — add questions to create one
              </p>
            )}

            {/* ── add question button ── */}
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors border border-white/8 rounded-sm px-4 py-2"
              >
                + Add question
              </button>
            ) : (
              // ── add question form ──
              <form onSubmit={handleAddQuestion} className="border border-white/10 rounded-sm p-4 flex flex-col gap-3">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25">// new question</p>

                <div>
                  <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Question</p>
                  <input
                    value={qForm.question}
                    onChange={e => setQForm({ ...qForm, question: e.target.value })}
                    placeholder="Type the question"
                    required
                    className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {['option1','option2','option3','option4'].map((k, i) => (
                    <div key={k}>
                      <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/20 mb-1">Option {i+1}</p>
                      <input
                        value={qForm[k]}
                        onChange={e => setQForm({ ...qForm, [k]: e.target.value })}
                        placeholder={`Option ${i+1}`}
                        required
                        className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Correct Answer</p>
                    <select
                      value={qForm.correctAnswer}
                      onChange={e => setQForm({ ...qForm, correctAnswer: e.target.value })}
                      required
                      className="w-full bg-[#080808] border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none"
                    >
                      <option value="">Select correct</option>
                      {['option1','option2','option3','option4'].map((k, i) => (
                        qForm[k] && <option key={k} value={qForm[k]}>Opt {i+1}: {qForm[k].slice(0,25)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-1">Explanation (optional)</p>
                    <input
                      value={qForm.explanation}
                      onChange={e => setQForm({ ...qForm, explanation: e.target.value })}
                      placeholder="Why this answer is correct"
                      className="w-full bg-white/4 border border-white/10 rounded-sm px-3 py-2 text-white text-xs outline-none focus:border-white/25 placeholder-white/15"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-white text-black font-bold text-xs px-4 py-2 rounded-sm disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : 'Add question →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setQForm(emptyQ) }}
                    className="border border-white/15 text-white/30 text-xs px-4 py-2 rounded-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard