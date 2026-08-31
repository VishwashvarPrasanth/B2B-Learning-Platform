const express = require('express')
const router = express.Router()
const { upload } = require('../config/cloudinary')
const {
  uploadVideo,
  deleteVideo,
  saveWatchProgress,
  getWatchProgress,
  getUserWatchStats,
  getAdminUserWatchStats
} = require('../controllers/videoController')
const { protect, adminOnly } = require('../middleware/authMiddleware')

// admin — upload video to module
router.post('/upload/:moduleId', protect, adminOnly, upload.single('video'), uploadVideo)

// admin — delete video from module
router.delete('/delete/:moduleId', protect, adminOnly, deleteVideo)

// user — save watch progress (called every 10 seconds)
router.post('/watch-progress', protect, saveWatchProgress)

// user — get watch progress for specific module
router.get('/watch-progress/:moduleId', protect, getWatchProgress)

// user — get all watch stats for dashboard
router.get('/my-stats', protect, getUserWatchStats)

// admin — get watch stats for specific user
router.get('/admin/user/:userId', protect, adminOnly, getAdminUserWatchStats)

module.exports = router