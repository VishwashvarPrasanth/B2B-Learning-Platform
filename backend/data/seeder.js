const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Question = require('../models/Question')
const questions = require('./question')

dotenv.config()

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB Connected')

    await Question.deleteMany()
    console.log('Old questions deleted')

    await Question.insertMany(questions)
    console.log('Questions seeded successfully')

    process.exit()
  } catch (error) {
    console.log('Error:', error.message)
    process.exit(1)
  }
}

seedDB()