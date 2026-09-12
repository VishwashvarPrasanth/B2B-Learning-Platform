const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  metadata: {
    type: Object,
    default: {}
  },
  // tracks where user is in onboarding flow
  onboardingStep: {
    type: String,
    enum: ['course_selection', 'assessment', 'completed'],
    default: 'course_selection'
  },
  // which course they enrolled in during onboarding
  onboardingCourseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)