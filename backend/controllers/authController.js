const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}
const generteTOken = (user) => {
  return jwt.sign(
    { id : user._id , role: user.role },process.env.JWT_SECRET , { expiresIn : '7d '}
  )
}
// JWT -> headers , signature , payload 
// this file for hashing , bcrypt..

// REGISTER 
const regsiterUser = async (req, res) => {
  const { name , email , password , role } = req.body

  try{
    const registerUser = async(req, res) => {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({ message :'Email already exists'})
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await User.create({
        name,
        email,
        password : hashedPassword,
        role: role || 'user'
      })

    }
  }catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }

}

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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { registerUser, loginUser }