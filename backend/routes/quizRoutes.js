const express = require('express')
const router = express.Router()
const {
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
} = require('../controllers/quizController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// ── ADMIN routes ──
// Create / replace full quiz for a module
router.post('/module/:moduleId', protect, adminOnly, createOrUpdateModuleQuiz)

// Add a single question to a module quiz
router.post('/module/:moduleId/questions', protect, adminOnly, addQuestionToQuiz)

// Update a single question by index
router.put('/module/:moduleId/questions/:questionIndex', protect, adminOnly, updateQuizQuestion)

// Delete a single question by index
router.delete('/module/:moduleId/questions/:questionIndex', protect, adminOnly, deleteQuizQuestion)

// Get full quiz (with answers) for admin
router.get('/module/:moduleId/admin', protect, adminOnly, getModuleQuizAdmin)

// Delete entire quiz for a module
router.delete('/module/:moduleId', protect, adminOnly, deleteModuleQuiz)

// Update quiz settings (title, passingScore)
router.patch('/module/:moduleId/settings', protect, adminOnly, updateQuizSettings)

// Get all attempts for a module (admin analytics)
router.get('/module/:moduleId/attempts', protect, adminOnly, getModuleQuizAttempts)

// ── USER routes ──
// Get quiz for a module (correct answers hidden)
router.get('/module/:moduleId', protect, getModuleQuizForUser)

// Submit quiz attempt
router.post('/module/:moduleId/submit', protect, submitModuleQuiz)

// Get my last attempt for a module
router.get('/module/:moduleId/my-attempt', protect, getMyQuizAttempt)

module.exports = router
