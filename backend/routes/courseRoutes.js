// POST /          → createCourse    → admin only
// POST /:courseId/modules → addModule → admin only
// GET /           → getCourses      → any logged in user
// GET /:courseId  → getCourseWithModules → any logged in user

const express = require('express')
const router = express.Router()

// missing at top
const { createCourse, addModule, getCourses, getCourseWithModules } = require('../controllers/courseController')
const { protect, adminOnly } = require('../middleware/authMiddleware')


router.post('/', protect, adminOnly, createCourse)
router.post('/:courseId/modules', protect, adminOnly, addModule)
router.get('/', protect, getCourses)
router.get('/:courseId', protect, getCourseWithModules)

module.exports = router

