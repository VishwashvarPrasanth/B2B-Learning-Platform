const Question = require('../models/Question')
const User = require('../models/User')

// admin — create question for a course
const createQuestion = async (req, res) => {
  try {
    const { courseId } = req.params
    const { question, options, correctAnswer, topic, difficulty } = req.body

    const newQuestion = await Question.create({
      courseId,
      question,
      options,
      correctAnswer,
      topic,
      difficulty
    })

    res.status(201).json({
      message: 'Question created successfully',
      question: newQuestion
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// admin — get all questions for a course
const getCourseQuestions = async (req, res) => {
  try {
    const { courseId } = req.params
    const questions = await Question.find({ courseId })
    res.status(200).json({ questions })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// admin — update a question
const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    const { question, options, correctAnswer, topic, difficulty } = req.body

    const updated = await Question.findByIdAndUpdate(
      questionId,
      { question, options, correctAnswer, topic, difficulty },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: 'Question not found' })
    }

    res.status(200).json({
      message: 'Question updated',
      question: updated
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// admin — delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params
    await Question.findByIdAndDelete(questionId)
    res.status(200).json({ message: 'Question deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// user — get questions for a course (hide correct answer)
const getQuestions = async (req, res) => {
  try {
    const { courseId } = req.params
    const questions = await Question.find({ courseId }, { correctAnswer: 0 })
    res.status(200).json({
      message: 'Questions fetched successfully',
      questions
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// user — submit assessment for a course
const submitAssessment = async (req, res) => {
  const { answers, courseId } = req.body

  try {
    const questions = await Question.find({ courseId })

    if (questions.length === 0) {
      return res.status(400).json({ message: 'No questions found for this course' })
    }

    // calculate score per topic
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

    // convert to percentage
    const scores = {}
    for (const topic in topicStats) {
      const { correct, total } = topicStats[topic]
      scores[topic] = Math.round((correct / total) * 100)
    }

    // save in user metadata
    await User.findByIdAndUpdate(req.user.id, {
      metadata: {
        assessmentDone: true,
        assessmentCourseId: courseId,
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

module.exports = {
  createQuestion,
  getCourseQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  submitAssessment
}