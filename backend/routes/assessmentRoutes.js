const express = require('express')
const router = express.Router()
const {
  createQuestion,
  getCourseQuestions,
  updateQuestion,
  deleteQuestion,
  getQuestions,
  submitAssessment
} = require('../controllers/assessmentController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// admin CRUD
router.post('/course/:courseId/questions', protect, adminOnly, createQuestion)
router.get('/course/:courseId/questions/all', protect, adminOnly, getCourseQuestions)
router.put('/questions/:questionId', protect, adminOnly, updateQuestion)
router.delete('/questions/:questionId', protect, adminOnly, deleteQuestion)

// user
router.get('/course/:courseId/questions', protect, getQuestions)
router.post('/submit', protect, submitAssessment)

module.exports = router