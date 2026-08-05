const express = require('express')
const router = express.Router()
const { getQuestions, submitAssessment } = require('../controllers/assessmentController')
const { protect } = require('../middleware/authMiddleware')

router.get('/questions', protect, getQuestions)
router.post('/submit', protect, submitAssessment)

module.exports = router