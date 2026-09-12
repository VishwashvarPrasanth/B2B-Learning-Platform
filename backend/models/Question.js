// models == blueprint or template how actually it could structured

const mongoose = require('mongoose')

const questionSchema = new mongoose.Schema({
  // which course this question belongs to
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: [String],
  correctAnswer: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  }
}, { timestamps: true })

module.exports = mongoose.model('Question', questionSchema)