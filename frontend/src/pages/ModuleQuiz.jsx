import { useState, useEffect } from 'react'
import api from '../services/api'

/**
 * ModuleQuiz — shown at the bottom of each module on the CoursePage.
 * Fetches the quiz for the active module, lets the user attempt it,
 * and displays a detailed result card when done.
 */
function ModuleQuiz({ moduleId, courseId }) {
  const [quiz, setQuiz] = useState(null)
  const [attempt, setAttempt] = useState(null)   // last saved attempt
  const [answers, setAnswers] = useState({})      // {questionIndex: selectedAnswer}
  const [result, setResult] = useState(null)      // submission result
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!moduleId) return
    setQuiz(null)
    setAttempt(null)
    setResult(null)
    setAnswers({})
    setQuizOpen(false)
    setLoading(true)
    fetchQuiz()
  }, [moduleId])

  const fetchQuiz = async () => {
    try {
      const [quizRes, attemptRes] = await Promise.allSettled([
        api.get(`/quiz/module/${moduleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/quiz/module/${moduleId}/my-attempt`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (quizRes.status === 'fulfilled') {
        setQuiz(quizRes.value.data.quiz)
      }
      if (attemptRes.status === 'fulfilled') {
        setAttempt(attemptRes.value.data.attempt)
      }
    } catch (err) {
      // no quiz for this module — that's fine
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (questionIndex, option) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: option }))
  }

  const handleSubmit = async () => {
    if (Object.keys(answers).length < quiz.questions.length) {
      setError('Please answer all questions before submitting.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([idx, selectedAnswer]) => ({
        questionIndex: parseInt(idx),
        selectedAnswer
      }))

      const res = await api.post(
        `/quiz/module/${moduleId}/submit`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setResult(res.data)
      setQuizOpen(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setAnswers({})
    setQuizOpen(true)
    setError('')
  }

  // ── no quiz exists ──
  if (loading) return null
  if (!quiz) {
    return (
      <div className="mt-8 border-t border-white/8 pt-6 mb-12">
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-3">
          // module quiz
        </p>
        <div className="border border-white/6 border-dashed rounded-sm px-5 py-4">
          <p className="text-white/20 text-xs font-bold tracking-[1px] uppercase">
            // No quiz created for this module yet
          </p>
        </div>
      </div>
    )
  }

  const totalQ = quiz.questions.length
  const answeredCount = Object.keys(answers).length

  return (
    <div className="mt-8 border-t border-white/8 pt-6">

      {/* section label */}
      <p className="text-[9px] font-bold tracking-[2px] uppercase text-white/20 mb-3">
        // module quiz
      </p>

      {/* ── RESULT CARD (after submission) ── */}
      {result && (
        <div className={`border rounded-sm p-5 mb-4 ${result.passed ? 'border-white/20' : 'border-white/8'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-xs font-bold tracking-[1px] uppercase mb-1 ${result.passed ? 'text-white' : 'text-white/40'}`}>
                {result.passed ? '✓ Quiz Passed' : '✗ Not Passed'}
              </p>
              <p className="text-white/30 text-[10px]">
                {result.correct} / {result.total} correct · passing score {result.passingScore}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white">{result.score}%</p>
            </div>
          </div>

          {/* per-question breakdown */}
          <div className="flex flex-col gap-2 mb-4">
            {result.detailedResults.map((r, i) => (
              <div
                key={i}
                className={`border rounded-sm px-3 py-2.5 ${r.correct ? 'border-white/12 bg-white/2' : 'border-white/6'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-white/25 text-[9px] font-bold tracking-[1px] uppercase mb-1">
                      Q{i + 1}
                    </p>
                    <p className="text-white text-xs font-bold leading-relaxed">{r.question}</p>
                    <div className="mt-1.5 flex flex-col gap-0.5">
                      <p className="text-white/30 text-[10px]">
                        Your answer: <span className={r.correct ? 'text-white' : 'text-white/40 line-through'}>{r.selectedAnswer}</span>
                      </p>
                      {!r.correct && (
                        <p className="text-white/50 text-[10px]">
                          Correct: <span className="text-white">{r.correctAnswer}</span>
                        </p>
                      )}
                      {r.explanation && (
                        <p className="text-white/20 text-[10px] mt-1 italic">{r.explanation}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-black flex-shrink-0 ${r.correct ? 'text-white' : 'text-white/20'}`}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleRetry}
            className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors border border-white/10 rounded-sm px-4 py-2"
          >
            Retry quiz →
          </button>
        </div>
      )}

      {/* ── PREVIOUS ATTEMPT BADGE (if attempt exists and no fresh result) ── */}
      {!result && attempt && (
        <div className="flex items-center justify-between border border-white/8 rounded-sm px-4 py-3 mb-4">
          <div>
            <p className="text-[9px] font-bold tracking-[1px] uppercase text-white/25 mb-0.5">
              Last attempt
            </p>
            <p className="text-white text-xs font-bold">
              {attempt.score}% · {attempt.passed ? 'Passed ✓' : 'Not passed'}
            </p>
          </div>
          <button
            onClick={() => setQuizOpen(!quizOpen)}
            className="text-[9px] font-bold tracking-[1px] uppercase text-white/30 hover:text-white transition-colors"
          >
            {quizOpen ? 'Close' : 'Retry →'}
          </button>
        </div>
      )}

      {/* ── QUIZ OPEN TRIGGER (first time) ── */}
      {!result && !quizOpen && !attempt && (
        <div
          className="border border-white/10 rounded-sm px-5 py-4 flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors group"
          onClick={() => setQuizOpen(true)}
        >
          <div>
            <p className="text-white font-bold text-sm">{quiz.title}</p>
            <p className="text-white/25 text-[10px] mt-0.5">
              {totalQ} question{totalQ !== 1 ? 's' : ''} · pass with {quiz.passingScore}%
            </p>
          </div>
          <span className="text-white/20 group-hover:text-white transition-colors text-sm font-black">
            Start →
          </span>
        </div>
      )}

      {/* ── QUIZ QUESTION PANEL ── */}
      {quizOpen && !result && (
        <div className="border border-white/10 rounded-sm overflow-hidden">

          {/* quiz header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
            <div>
              <p className="text-white font-bold text-sm">{quiz.title}</p>
              <p className="text-white/25 text-[10px]">
                {answeredCount}/{totalQ} answered · pass with {quiz.passingScore}%
              </p>
            </div>
            <button
              onClick={() => { setQuizOpen(false); setAnswers({}); setError('') }}
              className="text-white/20 hover:text-white/50 transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* progress bar */}
          <div className="h-[2px] bg-white/6">
            <div
              className="h-[2px] bg-white transition-all duration-300"
              style={{ width: `${(answeredCount / totalQ) * 100}%` }}
            />
          </div>

          {/* questions */}
          <div className="px-5 py-5 flex flex-col gap-6">
            {quiz.questions.map((q, qi) => (
              <div key={qi}>
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-white/20 mb-2">
                  Question {qi + 1}
                </p>
                <p className="text-white font-bold text-sm mb-3 leading-relaxed">{q.question}</p>

                <div className="flex flex-col gap-2">
                  {q.options.map((opt, oi) => {
                    const selected = answers[qi] === opt
                    return (
                      <button
                        key={oi}
                        onClick={() => handleSelect(qi, opt)}
                        className={`text-left border rounded-sm px-4 py-3 text-xs font-bold transition-all ${
                          selected
                            ? 'border-white/50 bg-white/8 text-white'
                            : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                        }`}
                      >
                        <span className="text-white/25 mr-2">{String.fromCharCode(65 + oi)}.</span>
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {error && (
              <p className="text-red-400 text-xs font-bold">{error}</p>
            )}

            {/* submit */}
            <div className="flex gap-3 pt-2 border-t border-white/6">
              <button
                onClick={handleSubmit}
                disabled={submitting || answeredCount < totalQ}
                className="bg-white text-black font-bold text-sm px-6 py-2.5 rounded-sm hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : `Submit Quiz →`}
              </button>
              <span className="text-white/15 text-xs self-center">
                {totalQ - answeredCount > 0 ? `${totalQ - answeredCount} unanswered` : 'All answered'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ModuleQuiz
