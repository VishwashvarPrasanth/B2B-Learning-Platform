const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

app.use(cors()) // cross origin relational connection 
app.use(express.json()) // it takes given input as json format 

app.use('/api/auth', require('./routes/authRoutes')) // if server comes this type of endpoint , access these folders, and this the rootpath

app.use('/api/assessment', require('./routes/assessmentRoutes'))  // add this

app.use('/api/roadmap', require('./routes/roadmapRoutes'))// add this

app.use('/api/courses', require('./routes/courseRoutes'))
app.use('/api/progress', require('./routes/progressRoutes'))

// cron jobs
const { Weeklystat } = require('./cron/weeklyStats')

app.use('/api/admin', require('./routes/adminRoutes'))

app.get('/', (req, res) => {
  res.send('API is running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})