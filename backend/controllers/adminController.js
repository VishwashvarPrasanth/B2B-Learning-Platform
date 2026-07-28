const express = require('express')
const User = require('../models/User')
const Course = require('../models/Course')
const Module = require('../models/Module') 
const DailyStats = require('../models/DailyStats')

const getDashboard = async (req, res) =>{
    try {
        
        const totalUsers = await User.countDocuments()

        const totalCourses = await Course.countDocuments()

        const totalModules = await Module.countDocuments()

        const recentStats = await DailyStats.findOne().sort({ date : -1})

        // recentStats   → DailyStats.findOne().sort({ date: -1 })
        //             (latest stat entry)
        res.status(200).json({ totalUsers, totalCourses, totalModules , recentStats })

    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}

module.exports = { getDashboard } 