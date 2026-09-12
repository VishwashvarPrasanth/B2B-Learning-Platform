const express = require('express')
const router = express.Router()

const { getDashboard, getUsers } = require('../controllers/adminController')

const { protect, adminOnly } = require('../middleware/authMiddleware')

router.get('/dashboard', protect, adminOnly, getDashboard)
router.get('/users', protect, adminOnly, getUsers)

module.exports = router
