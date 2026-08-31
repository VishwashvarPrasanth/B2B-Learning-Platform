const { cloudinary } = require('../config/cloudinary')
const Module = require('../models/Module')
const WatchProgress = require('../models/WatchProgress')
const Progress = require('../models/Progress')
const Roadmap = require('../models/roadmap')

// upload video to cloudinary and attach to module
const uploadVideo = async (req, res) => {
  try {
    const { moduleId } = req.params

    const module = await Module.findById(moduleId)
    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' })
    }

    const videoUrl = req.file.path
    const publicId = req.file.filename

    // cloudinary returns duration in seconds automatically
    // get it from the cloudinary response
    const cloudinaryResult = await cloudinary.api.resource(publicId, {
      resource_type: 'video'
    })

    // duration comes in seconds — e.g 3549 for 59:09
    const durationInSeconds = Math.round(cloudinaryResult.duration || 0)

    // convert to minutes for storing
    const durationInMinutes = Math.round(durationInSeconds / 60)

    // save to module
    module.contentUrl = videoUrl
    module.cloudinaryId = publicId
    module.duration = durationInMinutes        // minutes for display
    module.durationSeconds = durationInSeconds // seconds for tracking
    await module.save()

    res.status(200).json({
      message: 'Video uploaded successfully',
      videoUrl,
      duration: durationInMinutes,
      durationSeconds: durationInSeconds,
      module
    })
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message })
  }
}

// delete video from cloudinary
const deleteVideo = async (req, res) => {
  try {
    const { moduleId } = req.params
    const module = await Module.findById(moduleId)

    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    // delete from cloudinary if exists
    if (module.cloudinaryId) {
      await cloudinary.uploader.destroy(module.cloudinaryId, {
        resource_type: 'video'
      })
    }

    // clear video from module
    module.contentUrl = ''
    module.cloudinaryId = ''
    await module.save()

    res.status(200).json({ message: 'Video deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error: error.message })
  }
}

const saveWatchProgress = async (req, res) => {
  try {
    const { moduleId, courseId, watchedSeconds, totalSeconds, lastPosition } = req.body

    const watchPercentage = totalSeconds > 0
      ? Math.round((watchedSeconds / totalSeconds) * 100)
      : 0

    // auto complete if watched more than 80%
    const isCompleted = watchPercentage >= 80

    const watchProgress = await WatchProgress.findOneAndUpdate(
      { userId: req.user.id, moduleId },
      {
        userId: req.user.id,
        moduleId,
        courseId,
        watchedSeconds,
        totalSeconds,
        watchPercentage,
        lastPosition,
        isCompleted
      },
      { upsert: true, new: true }
    )

    // if watched 80%+ → auto mark module as complete in Progress and Roadmap
    if (isCompleted) {
      const existing = await Progress.findOne({
        userId: req.user.id,
        moduleId,
        courseId
      })

      if (!existing) {
        await Progress.create({
          userId: req.user.id,
          moduleId,
          courseId
        })
        console.log('Auto completed module in Progress:', moduleId)
      }

      // Also sync with Roadmap
      const targetModule = await Module.findById(moduleId)
      const roadmap = await Roadmap.findOne({ userId: req.user.id, courseId })
      if (roadmap && roadmap.modules) {
        let updated = false
        for (const item of roadmap.modules) {
          const matchesId = item.moduleId && item.moduleId.toString() === moduleId.toString()
          const matchesTopic = targetModule && (
            (item.topic && targetModule.skillTag && item.topic.toLowerCase() === targetModule.skillTag.toLowerCase()) ||
            (item.title && targetModule.title && item.title.toLowerCase() === targetModule.title.toLowerCase())
          )

          if (matchesId || matchesTopic) {
            item.completed = true
            updated = true
          }
        }
        if (updated) await roadmap.save()
      }
    }

    res.status(200).json({ message: 'Watch progress saved', watchProgress })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// get watch progress for a module
const getWatchProgress = async (req, res) => {
  try {
    const { moduleId } = req.params

    const watchProgress = await WatchProgress.findOne({
      userId: req.user.id,
      moduleId
    })

    res.status(200).json({
      watchProgress: watchProgress || null
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// get all watch progress for a user — for dashboard
const getUserWatchStats = async (req, res) => {
  try {
    const watchRecords = await WatchProgress.find({ userId: req.user.id })
      .populate('moduleId', 'title skillTag duration')
      .populate('courseId', 'title')

    // calculate total watch time in minutes
    const totalWatchSeconds = watchRecords.reduce((sum, r) => sum + r.watchedSeconds, 0)
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60)

    // modules fully watched
    const completedVideos = watchRecords.filter(r => r.isCompleted).length

    res.status(200).json({
      watchRecords,
      totalWatchMinutes,
      completedVideos,
      totalModulesStarted: watchRecords.length
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// admin — get watch stats for specific user
const getAdminUserWatchStats = async (req, res) => {
  try {
    const { userId } = req.params

    const watchRecords = await WatchProgress.find({ userId })
      .populate('moduleId', 'title skillTag duration')
      .populate('courseId', 'title')

    const totalWatchSeconds = watchRecords.reduce((sum, r) => sum + r.watchedSeconds, 0)
    const totalWatchMinutes = Math.round(totalWatchSeconds / 60)
    const completedVideos = watchRecords.filter(r => r.isCompleted).length

    res.status(200).json({
      watchRecords,
      totalWatchMinutes,
      completedVideos,
      totalModulesStarted: watchRecords.length
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = {
  uploadVideo,
  deleteVideo,
  saveWatchProgress,
  getWatchProgress,
  getUserWatchStats,
  getAdminUserWatchStats
}