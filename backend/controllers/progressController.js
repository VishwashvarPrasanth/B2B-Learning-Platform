const Module = require("../models/Module")
const Progress = require("../models/Progress")

const markcomplete = async (req, res)=>{
    try{
        const { courseId, moduleId} = req.body
        const iscompleted = await Progress.findOne({userId: req.user.id,courseId, moduleId })
        if(iscompleted){
            return res.status(400).json({message : 'already completed'})
        }
        const createprogress = await Progress.create({userId : req.user.id, courseId, moduleId})
    }catch(error){
        res.status(400).json({message: error.message})
    }
}

const getCourseProgress = async (req, res) =>{
    try{
        const{ courseId } = req.params
        const totalModules = await  Module.countDocuments({courseId})

        const completed = await Progress.countDocuments({userId: req.user.id, courseId})

        const completePercentage = Math.round((completed/totalModules) * 100)

        return res.status(200).json({totalModules,completed,completePercentage})

    }catch(error){
        return res.status(500).json({message:'server Error',error: error.message})
    }
}

module.exports = { markcomplete, getCourseProgress }