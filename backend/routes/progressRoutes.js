const express = require('express')
const router = express.Router()
const { markcomplete, getCourseProgress } = require('../controllers/progressController')
const { protect } = require('../middleware/authMiddleware')


router.post('/complete',protect,markcomplete)
router.get('/:courseId',protect,getCourseProgress)

module.exports = router
