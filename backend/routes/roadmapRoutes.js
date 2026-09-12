const express = require('express')
const router = express.Router()
const { generateRoadmap, getRoadmap, getAllRoadmaps } = require('../controllers/roadmapController')
const { protect } = require('../middleware/authMiddleware')

router.get('/all', protect, getAllRoadmaps)
router.post('/generate', protect, generateRoadmap)
router.get('/', protect, getRoadmap)

module.exports = router