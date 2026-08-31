const Quiz = require('../models/Quiz')
const QuizAttempt = require('../models/QuizAttempt')
const Module = require('../models/Module')

// ── ADMIN: create or update quiz for a module (upsert) ──
const createOrUpdateModuleQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { title, questions, passingScore } = req.body

    // verify module exists
    const module = await Module.findById(moduleId)
    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    // upsert: update if exists, create if not
    const quiz = await Quiz.findOneAndUpdate(
      { moduleId },
      {
        moduleId,
        courseId: module.courseId,
        title: title || `${module.title} Quiz`,
        questions: questions || [],
        passingScore: passingScore ?? 60
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    res.status(200).json({
      message: 'Quiz saved successfully',
      quiz
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: add a single question to a module quiz ──
const addQuestionToQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { question, options, correctAnswer, explanation } = req.body

    const module = await Module.findById(moduleId)
    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    // ensure quiz exists, create empty if not
    let quiz = await Quiz.findOne({ moduleId })
    if (!quiz) {
      quiz = await Quiz.create({
        moduleId,
        courseId: module.courseId,
        title: `${module.title} Quiz`,
        questions: [],
        passingScore: 60
      })
    }

    quiz.questions.push({ question, options, correctAnswer, explanation: explanation || '' })
    await quiz.save()

    res.status(201).json({
      message: 'Question added to quiz',
      quiz
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: update a single question in quiz ──
const updateQuizQuestion = async (req, res) => {
  try {
    const { moduleId, questionIndex } = req.params
    const { question, options, correctAnswer, explanation } = req.body

    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

    const idx = parseInt(questionIndex)
    if (idx < 0 || idx >= quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' })
    }

    quiz.questions[idx] = {
      question: question ?? quiz.questions[idx].question,
      options: options ?? quiz.questions[idx].options,
      correctAnswer: correctAnswer ?? quiz.questions[idx].correctAnswer,
      explanation: explanation ?? quiz.questions[idx].explanation
    }
    await quiz.save()

    res.status(200).json({ message: 'Question updated', quiz })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: delete a single question from quiz ──
const deleteQuizQuestion = async (req, res) => {
  try {
    const { moduleId, questionIndex } = req.params

    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

    const idx = parseInt(questionIndex)
    if (idx < 0 || idx >= quiz.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' })
    }

    quiz.questions.splice(idx, 1)
    await quiz.save()

    res.status(200).json({ message: 'Question deleted', quiz })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: get full quiz for a module (with correct answers) ──
const getModuleQuizAdmin = async (req, res) => {
  try {
    const { moduleId } = req.params
    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'No quiz for this module' })
    res.status(200).json({ quiz })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: delete entire quiz for a module ──
const deleteModuleQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params
    await Quiz.findOneAndDelete({ moduleId })
    res.status(200).json({ message: 'Quiz deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: update quiz settings (title, passingScore) ──
const updateQuizSettings = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { title, passingScore } = req.body

    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

    if (title !== undefined) quiz.title = title
    if (passingScore !== undefined) quiz.passingScore = passingScore
    await quiz.save()

    res.status(200).json({ message: 'Quiz settings updated', quiz })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── USER: get quiz for a module (hides correct answers) ──
const getModuleQuizForUser = async (req, res) => {
  try {
    const { moduleId } = req.params
    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'No quiz available for this module' })

    // strip correctAnswer from questions
    const safeQuestions = quiz.questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      explanation: q.explanation
      // correctAnswer intentionally omitted
    }))

    res.status(200).json({
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        questions: safeQuestions
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── USER: submit quiz attempt ──
const submitModuleQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { answers } = req.body  // [{questionIndex, selectedAnswer}]
    const userId = req.user.id

    const quiz = await Quiz.findOne({ moduleId })
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' })

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: 'No answers submitted' })
    }

    // calculate score
    let correct = 0
    const detailedResults = answers.map((a) => {
      const q = quiz.questions[a.questionIndex]
      if (!q) return { questionIndex: a.questionIndex, correct: false }
      const isCorrect = a.selectedAnswer === q.correctAnswer
      if (isCorrect) correct++
      return {
        questionIndex: a.questionIndex,
        question: q.question,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        correct: isCorrect
      }
    })

    const score = Math.round((correct / quiz.questions.length) * 100)
    const passed = score >= quiz.passingScore

    // save attempt
    const attempt = await QuizAttempt.create({
      userId,
      moduleId,
      courseId: quiz.courseId,
      quizId: quiz._id,
      answers,
      score,
      passed
    })

    res.status(200).json({
      message: passed ? 'Quiz passed!' : 'Quiz not passed — try again',
      score,
      passed,
      passingScore: quiz.passingScore,
      correct,
      total: quiz.questions.length,
      detailedResults,
      attemptId: attempt._id
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── USER: get their last quiz attempt for a module ──
const getMyQuizAttempt = async (req, res) => {
  try {
    const { moduleId } = req.params
    const userId = req.user.id

    const attempt = await QuizAttempt.findOne({ userId, moduleId }).sort({ createdAt: -1 })
    if (!attempt) return res.status(404).json({ message: 'No attempt found' })

    res.status(200).json({ attempt })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ── ADMIN: get all attempts for a module quiz ──
const getModuleQuizAttempts = async (req, res) => {
  try {
    const { moduleId } = req.params
    const attempts = await QuizAttempt.find({ moduleId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
    res.status(200).json({ attempts })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  createOrUpdateModuleQuiz,
  addQuestionToQuiz,
  updateQuizQuestion,
  deleteQuizQuestion,
  getModuleQuizAdmin,
  deleteModuleQuiz,
  updateQuizSettings,
  getModuleQuizForUser,
  submitModuleQuiz,
  getMyQuizAttempt,
  getModuleQuizAttempts
}
