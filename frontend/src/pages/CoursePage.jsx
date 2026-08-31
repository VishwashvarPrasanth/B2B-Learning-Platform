import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import ModuleQuiz from './ModuleQuiz'
import ReactPlayer from 'react-player'

function CoursePage() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [activeModule, setActiveModule] = useState(null)
  const [error, setError] = useState('')
  const [videoDuration, setVideoDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [watchInterval, setWatchInterval] = useState(null)

  const token = localStorage.getItem('token')

 useEffect(() => {
  const fetchData = async () => {
    try {
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/progress/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      setCourse(courseRes.data.course)
      setModules(courseRes.data.modules)
      setProgress(progressRes.data)

      // auto select module based on skill param
      const params = new URLSearchParams(window.location.search)
      const skill = params.get('skill')

      if (skill) {
        const matched = courseRes.data.modules.find(
          m => m.skillTag?.toLowerCase() === skill.toLowerCase() ||
               m.title?.toLowerCase().includes(skill.toLowerCase())
        )
        setActiveModule(matched || courseRes.data.modules[0])
      } else {
        setActiveModule(courseRes.data.modules[0])
      }

        } catch (err) {
        setError('Failed to load course')
        } finally {
        setLoading(false)
        }
    }
    fetchData()
    }, [id])

  const isCompleted = (moduleId) => {
    return progress?.completedList?.some(p => p.moduleId?._id === moduleId || p.moduleId === moduleId)
  }

  const handleMarkComplete = async () => {
    if (!activeModule) return
    setMarking(true)
    try {
      await api.post('/progress/complete',
        { courseId: id, moduleId: activeModule._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const progressRes = await api.get(`/progress/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProgress(progressRes.data)

      const nextIndex = modules.findIndex(m => m._id === activeModule._id) + 1
      if (nextIndex < modules.length) {
        setActiveModule(modules[nextIndex])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark complete')
    } finally {
      setMarking(false)
    }
  }
  useEffect(() => {
  // clear previous interval
  if (watchInterval) clearInterval(watchInterval)

  if (!activeModule || !videoDuration) return

  // send watch progress every 10 seconds
  const interval = setInterval(async () => {
    if (currentTime > 0 && videoDuration > 0) {
      try {
        await api.post('/videos/watch-progress', {
          moduleId: activeModule._id,
          courseId: id,
          watchedSeconds: Math.round(currentTime),
          totalSeconds: Math.round(videoDuration),
          lastPosition: Math.round(currentTime)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } catch (err) {
        // silently fail — don't disrupt viewing experience
        console.log('Watch progress error:', err.message)
      }
    }
  }, 10000) // every 10 seconds

  setWatchInterval(interval)

  // cleanup on unmount
  return () => clearInterval(interval)
}, [activeModule, videoDuration, currentTime])


  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-white/30 text-xs font-bold tracking-[2px] uppercase">// loading course...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">

      {/* sidebar */}
      <div className="w-[180px] flex-shrink-0 border-r border-white/6 flex flex-col px-5 py-6 bg-[#060606]">
        <span className="font-black text-white text-sm tracking-tight mb-8">B2B Learn.</span>
        <nav className="flex flex-col gap-1 flex-1">
          <a href="/dashboard" className="text-[10px] font-bold tracking-[1px] uppercase text-white/25 px-3 py-2 hover:text-white/50 transition-colors">
            Dashboard
          </a>
          <a href="/dashboard" className="text-[10px] font-bold tracking-[1px] uppercase text-white bg-white/6 px-3 py-2 rounded-sm">
            Courses
          </a>
          <a href="/dashboard" className="text-[10px] font-bold tracking-[1px] uppercase text-white/25 px-3 py-2 hover:text-white/50 transition-colors">
            Profile
          </a>
        </nav>
        <a href="/dashboard" className="text-[10px] font-bold tracking-[1px] uppercase text-white/20 px-3 py-2 hover:text-white/40 transition-colors">
          ← Back
        </a>
      </div>

      {/* main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* top bar */}
        <div className="flex justify-between items-center px-8 py-4 border-b border-white/5">
          <div>
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-0.5">// course</p>
            <p className="text-white font-bold text-sm">{course?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-0.5">Progress</p>
            <p className="text-white font-black text-lg">{progress?.percentage || 0}%</p>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* module list */}
          <div className="w-[240px] border-r border-white/6 overflow-y-auto px-4 py-5">
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-4">// modules</p>

            {/* progress bar */}
            <div className="h-[2px] bg-white/8 rounded-sm mb-5">
              <div
                className="h-[2px] bg-white rounded-sm transition-all"
                style={{ width: `${progress?.percentage || 0}%` }}
              />
            </div>

            <div className="flex flex-col gap-2">
              {modules.map((module, index) => {
                const done = isCompleted(module._id)
                const active = activeModule?._id === module._id
                return (
                  <button
                    key={module._id}
                    onClick={() => setActiveModule(module)}
                    className={`text-left border rounded-sm px-3 py-3 transition-all ${
                      active
                        ? 'border-white/30 bg-white/4'
                        : 'border-white/6 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${done ? 'bg-white' : active ? 'bg-white/60' : 'bg-white/15'}`} />
                      <span className={`text-[9px] font-bold tracking-[1px] uppercase ${done ? 'text-white/40' : active ? 'text-white' : 'text-white/25'}`}>
                        {module.difficulty}
                      </span>
                    </div>
                    <p className={`text-xs font-bold leading-tight ${done ? 'text-white/35 line-through' : 'text-white'}`}>
                      {module.title}
                    </p>
                    {done && (
                      <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 mt-1">done</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* content area */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeModule ? (
              <>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-2">
                  // {activeModule.skillTag?.toLowerCase()}
                </p>
                <h1 className="text-2xl font-black text-white tracking-tight mb-2">
                  {activeModule.title}
                </h1>
                <p className="text-sm text-white/35 mb-6 leading-relaxed">
                  {activeModule.description || 'No description provided.'}
                </p>

              
                {/* video player with react-player */}
                {activeModule.contentUrl ? (
                  <div className="border border-white/8 rounded-sm mb-6 overflow-hidden bg-black">
                    <ReactPlayer
                      key={activeModule._id}
                      url={activeModule.contentUrl}
                      controls
                      width="100%"
                      height="auto"
                      style={{ aspectRatio: '16/9' }}
                      onDuration={(duration) => {
                        // get video duration automatically
                        setVideoDuration(duration)
                      }}
                      onProgress={(state) => {
                        // track current position
                        setCurrentTime(state.playedSeconds)
                      }}
                      config={{
                        file: {
                          attributes: {
                            controlsList: 'nodownload'
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="border border-white/8 rounded-sm mb-6 aspect-video flex items-center justify-center">
                    <p className="text-white/15 text-xs font-bold tracking-[2px] uppercase">
                      // no video content
                    </p>
                  </div>
                )}

                {/* module info */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="border border-white/8 rounded-sm p-3">
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Duration</p>
                    <p className="text-white font-bold text-sm">{activeModule.duration || '—'} min</p>
                  </div>
                  <div className="border border-white/8 rounded-sm p-3">
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Difficulty</p>
                    <p className="text-white font-bold text-sm capitalize">{activeModule.difficulty}</p>
                  </div>
                  <div className="border border-white/8 rounded-sm p-3">
                    <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">Skill</p>
                    <p className="text-white font-bold text-sm">{activeModule.skillTag}</p>
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

                {/* actions */}
                <div className="flex gap-3">
                  {/* auto progress indicator */}
                  <div className="border border-white/6 rounded-sm px-4 py-3">
                    <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-1">
                      // auto tracking
                    </p>
                    <p className="text-white/30 text-xs">
                      {isCompleted(activeModule._id)
                        ? '✓ Module completed'
                        : 'Continue Learning'}
                    </p>
                  </div>

                  {modules.findIndex(m => m._id === activeModule._id) < modules.length - 1 && (
                    <button
                      onClick={() => {
                        const nextIndex = modules.findIndex(m => m._id === activeModule._id) + 1
                        setActiveModule(modules[nextIndex])
                      }}
                      className="border border-white/20 text-white/60 font-bold text-sm px-6 py-2.5 rounded-sm hover:border-white/40 transition-colors"
                    >
                      Next →
                    </button>
                  )}
                </div>

                {/* ── Module Quiz (shown after content) ── */}
                <ModuleQuiz moduleId={activeModule._id} courseId={id} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-white/20 text-xs font-bold tracking-[2px] uppercase">// select a module</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}

export default CoursePage