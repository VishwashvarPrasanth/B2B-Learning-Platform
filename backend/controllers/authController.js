const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }
  )
}
// JWT -> headers , signature , payload 
// this file for hashing , bcrypt..

// Builds the user object sent back to the client on register/login.
// Keep this in sync with whatever fields the frontend needs for routing.
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  onboardingStep: user.onboardingStep
})

// REGISTER
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body

  try {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    })
    //for this moment , checks if email already exists , or not change the password into hashed one.

    res.status(201).json({ // this jwt token generation  
      message: 'User registered successfully',
      token: generateToken(user),
      user: buildUserResponse(user)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// LOGIN  
// checks email already exists , if not invalid credinats , also password mismatch , it is invalid password
const loginUser = async (req, res) => {
  const { email, password } = req.body // destructing

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Password' })
    }

    res.status(200).json({
      message: 'Login successful',
      token: generateToken(user),
      user: buildUserResponse(user)
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getMe = async (req, res) => {
  try {
    console.log('getMe called, user id:', req.user?.id)
    const user = await User.findById(req.user.id, { password: 0 })
    console.log('user found:', user?.email)

    const scores = user?.metadata?.scores || {}
    console.log('scores:', scores)

    const topics = Object.entries(scores)
    const avg = topics.length
      ? Math.round(topics.reduce((sum, [, v]) => sum + v, 0) / topics.length)
      : 0

    console.log('avg:', avg)

    res.status(200).json({
      user,
      assessmentScores: scores,
      averageScore: avg
    })
  } catch (error) {
    console.log('getMe ERROR:', error.message)
    console.log('getMe STACK:', error.stack)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { registerUser, loginUser, getMe }
