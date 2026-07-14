const Question = require('../models/Question')
const User = require('../models/User')

// GET questions
const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}, {
      correctAnswer: 0  // hide correct answer from frontend
    })

    res.status(200).json({
      message: 'Questions fetched successfully',
      questions
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// POST submit answers
const submitAssessment = async (req, res) => {
  const { answers } = req.body
  // answers format:
  // [ { questionId: "...", selectedAnswer: "..." } ]

  try {
    const questions = await Question.find()

    // Step 1 - calculate score per topic
    const topicStats = {}

    for (const answer of answers) {
      const question = questions.find(
        q => q._id.toString() === answer.questionId
      )

      if (!question) continue

      const topic = question.topic

      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 }
      }

      topicStats[topic].total += 1

      if (answer.selectedAnswer === question.correctAnswer) {
        topicStats[topic].correct += 1
      }
    }

    // Step 2 - convert to percentage
    const scores = {}
    for (const topic in topicStats) {
      const { correct, total } = topicStats[topic]
      scores[topic] = Math.round((correct / total) * 100)
    }

    // Step 3 - save in user metadata
    await User.findByIdAndUpdate(req.user.id, {
      metadata: {
        assessmentDone: true,
        scores
      }
    })

    res.status(200).json({
      message: 'Assessment submitted successfully',
      scores
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { getQuestions, submitAssessment }