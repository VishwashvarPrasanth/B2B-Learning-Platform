const mongoose = require('mongoose')

const Dailystat = new mongoose.Schema({
    date:{
        type: Date,
        default: Date.now
    },
    totalUsers:{
        type: Number,
        default: 0
    },
    totalCourses:{
        type:Number,
        default: 0
    },
    avgProgress:{
        type: Number,
        default: 0
    }
},{timestamps: true}
)
module.exports = mongoose.model('DailyStats',Dailystat)