import { useState, useEffect } from 'react'
import api from '../services/api'

function Assessment() {
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await api.get('/assessment/questions', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setQuestions(response.data.questions)
      } catch (err) {
        setError('Failed to load questions')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleSelect = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const formatted = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId,
        selectedAnswer
      }))
      const response = await api.post('/assessment/submit',
        { answers: formatted },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      localStorage.setItem('assessmentScores', JSON.stringify(response.data.scores))
      window.location.href = '/assessment/result'
    } catch (err) {
      setError('Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-white/30 text-xs font-bold tracking-[2px] uppercase">// loading questions...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <p className="text-red-400 text-xs">{error}</p>
      </div>
    )
  }

  const question = questions[current]
  const progress = ((current + 1) / questions.length) * 100
  const isLast = current === questions.length - 1
  const isAnswered = answers[question?._id]

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col">

      {/* navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-white/5">
        <span className="font-black text-white text-base tracking-tight">B2B Learn.</span>
        <span className="text-[9px] font-bold tracking-[2px] uppercase text-white/30">
          Skill Assessment
        </span>
        <span className="text-[9px] font-bold tracking-[2px] uppercase text-white/30">
          {current + 1} / {questions.length}
        </span>
      </nav>

      {/* progress bar */}
      <div className="w-full h-[2px] bg-white/6">
        <div
          className="h-[2px] bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-4">
            // {question?.topic?.toLowerCase()}
          </p>

          <h2 className="text-xl font-bold text-white leading-relaxed mb-8">
            {question?.question}
          </h2>

          <div className="flex flex-col gap-3 mb-10">
            {question?.options?.map((option, i) => (
              <button
                key={i}
                onClick={() => handleSelect(question._id, option)}
                className={`text-left border rounded-sm px-4 py-3 text-sm transition-all ${
                  answers[question._id] === option
                    ? 'border-white/50 text-white bg-white/4'
                    : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            {current > 0 && (
              <button
                onClick={() => setCurrent(current - 1)}
                className="border border-white/20 text-white/60 text-sm px-5 py-2.5 rounded-sm hover:border-white/40 transition-colors"
              >
                ← Back
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => setCurrent(current + 1)}
                disabled={!isAnswered}
                className="flex-1 bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-30"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isAnswered || submitting}
                className="flex-1 bg-white text-black font-bold text-sm py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-30"
              >
                {submitting ? 'Submitting...' : 'Submit assessment →'}
              </button>
            )}
          </div>

        </div>
      </div>

    </div>
  )
}

export default Assessment