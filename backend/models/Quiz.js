const mongoose = require('mongoose')

const quizSchema = new mongoose.Schema({
  // linked to specific module
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
    unique: true  // one quiz per module
  },
  // which course it belongs to
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  questions: [
    {
      question: { type: String, required: true },
      options: [String],
      correctAnswer: { type: String, required: true },
      explanation: { type: String, default: '' }
    }
  ],
  passingScore: {
    type: Number,
    default: 60  // 60% to pass
  }
}, { timestamps: true })

module.exports = mongoose.model('Quiz', quizSchema)