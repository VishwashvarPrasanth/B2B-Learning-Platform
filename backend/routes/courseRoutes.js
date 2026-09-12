// POST /          → createCourse    → admin only
// POST /:courseId/modules → addModule → admin only
// GET /           → getCourses      → any logged in user
// GET /:courseId  → getCourseWithModules → any logged in user

const express = require('express')
const router = express.Router()
const {
  createCourse,
  addModule,
  getCourses,
  getCourseWithModules,
  deleteCourse,
  updateCourse,
  deleteModule,
  updateModule
} = require('../controllers/courseController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

router.post('/', protect, adminOnly, createCourse)
router.post('/:courseId/modules', protect, adminOnly, addModule)
router.get('/', protect, getCourses)
router.get('/:courseId', protect, getCourseWithModules)
router.put('/:courseId', protect, adminOnly, updateCourse)
router.delete('/:courseId', protect, adminOnly, deleteCourse)
router.delete('/modules/:moduleId', protect, adminOnly, deleteModule)
router.put('/modules/:moduleId', protect, adminOnly, updateModule)

module.exports = router

