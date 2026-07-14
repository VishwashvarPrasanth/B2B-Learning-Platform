// here where the token checks happens for every req/ reponse

const jwt = require('jsonwebtoken')

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] // jwt contains 3 parts - headers where token lies , payloads , signature

  if (!token) {
    return res.status(401).json({ message: 'No token, access denied' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } 
  catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' })
  }
  next()// this gives permission to do what actaully it comes for
}

module.exports = { protect, adminOnly }