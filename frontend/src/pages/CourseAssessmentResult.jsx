import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'

function CourseAssessmentResult() {
  const { courseId } = useParams()
  const scores = JSON.parse(localStorage.getItem('assessmentScores') || '{}')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  const topics = Object.entries(scores)
  const avg = topics.length
    ? Math.round(topics.reduce((sum, [, v]) => sum + v, 0) / topics.length)
    : 0

    const handleGenerate = async () => {
      setLoading(true)
      setError('')
      try {
        await api.post('/roadmap/generate',
          { courseId },  // pass courseId
          { headers: { Authorization: `Bearer ${token}` } }
        )
        // go to dashboard with this course context
        window.location.href = `/dashboard?courseId=${courseId}`
      } catch (err) {
        setError('Failed to generate roadmap. Try again.')
      } finally {
        setLoading(false)
      }
    }

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">

      {/* navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <span className="font-black text-white text-base tracking-tight">B2B Learn.</span>
        <span className="text-[9px] font-bold tracking-[2px] uppercase text-white/30">
          Assessment complete
        </span>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-4">
            // skill profile
          </p>

          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight mb-1">
            Your results.
          </h1>
          <p className="text-sm italic text-white/35 mb-8" style={{ fontFamily: 'Georgia, serif' }}>
            AI will build your path from this.
          </p>

          {/* overall score ring */}
          <div className="border border-white/10 rounded-sm p-4 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">{avg}%</span>
            </div>
            <div>
              <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/30 mb-1">
                Overall score
              </p>
              <p className="text-white text-sm font-bold">
                {avg >= 70 ? 'Strong foundation' : avg >= 40 ? 'Intermediate level' : 'Beginner level'}
              </p>
            </div>
          </div>

          {/* per topic scores */}
          <div className="flex flex-col gap-3 mb-8">
            {topics.map(([topic, score]) => (
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
              </div>
            ))}
          </div>

          {/* ai note */}
          <div className="border border-white/8 rounded-sm px-4 py-3 mb-6">
            <p className="text-[10px] font-bold tracking-[1.5px] uppercase text-white/25 mb-1">// ai note</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Groq LLM will skip what you already know and build only what you need.
            </p>
          </div>

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {loading ? 'Generating roadmap...' : 'Generate my roadmap →'}
          </button>

        </div>
      </div>

    </div>
  )
}

export default CourseAssessmentResult