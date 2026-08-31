const mongoose = require('mongoose')

const watchProgressSchema = new mongoose.Schema({
  // who is watching
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // which module
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  // which course
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // how many seconds user has watched
  watchedSeconds: {
    type: Number,
    default: 0
  },
  // total video duration in seconds
  totalSeconds: {
    type: Number,
    default: 0
  },
  // percentage watched
  watchPercentage: {
    type: Number,
    default: 0
  },
  // last position user was at (for resume)
  lastPosition: {
    type: Number,
    default: 0
  },
  // did user finish watching (>80% = complete)
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

// one record per user per module
watchProgressSchema.index({ userId: 1, moduleId: 1 }, { unique: true })

module.exports = mongoose.model('WatchProgress', watchProgressSchema)