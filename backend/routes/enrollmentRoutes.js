const express = require('express')
const router = express.Router()
const { enrollCourse, getCoursesWithEnrollment } = require('../controllers/enrollmentController')
const { protect } = require('../middleware/authMiddleware')

router.post('/enroll', protect, enrollCourse)
router.get('/', protect, getCoursesWithEnrollment)

module.exports = router