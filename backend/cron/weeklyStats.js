const cron = require('node-cron')
const User = require('../models/User') 
const DailyStats = require('../models/DailyStats')  
const Course = require('../models/Course')
const Progress = require('../models/Progress')

//                                m h d m w
const Weeklystat = cron.schedule('0 7 * * 1', async ()=> {
    try{
        const totalUsers = await User.countDocuments()

        const totalCourses = await Course.countDocuments()

        const totalProgress = await Progress.countDocuments()

        const avgProgress = totalUsers === 0 ? 0 : Math.round((totalProgress / totalUsers) * 100)

        const stats = await DailyStats.create({ totalUsers, totalCourses, avgProgress })
        console.log('Weekly stats saved: ', new Date())

    }catch(error){
        console.log('Cron error', error.message)
    }
})
module.exports = { Weeklystat }