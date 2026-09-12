const express = require('express')
const User = require('../models/User')
const Course = require('../models/Course')
const Module = require('../models/Module') 
const DailyStats = require('../models/DailyStats')

const getDashboard = async (req, res) =>{
    try {
        
        const totalUsers = await User.countDocuments()

        const totalCourses = await Course.countDocuments()

        const totalModules = await Module.countDocuments()

        const recentStats = await DailyStats.findOne().sort({ date : -1})

        // recentStats   → DailyStats.findOne().sort({ date: -1 })
        //             (latest stat entry)
        res.status(200).json({ totalUsers, totalCourses, totalModules , recentStats })

    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}
const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password')
        res.status(200).json({ users })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}
const getAdminUserWatchStats = async (req, res) => {
  try {
    console.log('==============================')
    console.log('ADMIN USER PROGRESS')
    console.log('Requested User ID:', req.params.userId)
    console.log('Admin User:', req.user)

    const { userId } = req.params

    const watchRecords = await WatchProgress.find({ userId })
      .populate('moduleId', 'title skillTag duration')
      .populate('courseId', 'title')

    console.log('Watch Records:', watchRecords)

    const totalWatchSeconds = watchRecords.reduce(
      (sum, r) => sum + r.watchedSeconds,
      0
    )

    const totalWatchMinutes = Math.round(totalWatchSeconds / 60)

    const completedVideos = watchRecords.filter(
      r => r.isCompleted
    ).length

    console.log('Total Watch Seconds:', totalWatchSeconds)
    console.log('Total Watch Minutes:', totalWatchMinutes)
    console.log('Completed Videos:', completedVideos)

    res.status(200).json({
      watchRecords,
      totalWatchMinutes,
      completedVideos,
      totalModulesStarted: watchRecords.length
    })

  } catch (error) {

    console.log('ADMIN USER PROGRESS ERROR:', error.message)
    console.log('STACK:', error.stack)

    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}
module.exports = { getDashboard, getUsers,getAdminUserWatchStats } 