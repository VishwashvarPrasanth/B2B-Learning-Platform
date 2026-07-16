const mongoose = require('mongoose')

const roadmapSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

module.exports = mongoose.model('Roadmap', roadmapSchema)