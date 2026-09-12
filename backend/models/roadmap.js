const mongoose = require('mongoose')

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // which course this roadmap belongs to
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  modules: [
    {
      topic: String,
      level: String,
      reason: String,
      order: Number,
      completed: {
        type: Boolean,
        default: false
      }
    }
  ],
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true })

// one roadmap per user per course
roadmapSchema.index({ userId: 1, courseId: 1 }, { unique: true })

module.exports = mongoose.model('Roadmap', roadmapSchema)