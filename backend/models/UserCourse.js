const mongoose = require('mongoose')

const userCourseSchema = new mongoose.Schema({
  // which user enrolled
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // which course they enrolled in
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // enrollment date
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// one enrollment per user per course
userCourseSchema.index({ userId: 1, courseId: 1 }, { unique: true })

module.exports = mongoose.model('UserCourse', userCourseSchema)