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

app.get('/', (req, res) => {
  res.send('API is running')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})