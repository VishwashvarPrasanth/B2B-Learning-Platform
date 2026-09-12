const Module = require("../models/Module")
const Progress = require("../models/Progress")
const Roadmap = require("../models/roadmap")

const markcomplete = async (req, res) => {
  try {
    const { courseId, moduleId } = req.body

    if (!courseId || !moduleId) {
      return res.status(400).json({ message: 'courseId and moduleId are required' })
    }

    const alreadyCompleted = await Progress.findOne({
      userId: req.user.id,
      courseId,
      moduleId
    })

    if (alreadyCompleted) {
      return res.status(400).json({ message: 'already completed' })
    }

    const moduleDoc = await Module.findById(moduleId)
    if (!moduleDoc) {
      return res.status(404).json({ message: 'Module not found' })
    }

    const progress = await Progress.create({
      userId: req.user.id,
      courseId,
      moduleId
    })

    // sync the roadmap so the dashboard's progress bar/checklist reflects it
    if (moduleDoc.skillTag) {
      await Roadmap.updateOne(
        {
          userId: req.user.id,
          courseId,
          modules: {
            $elemMatch: { topic: { $regex: `^${moduleDoc.skillTag}$`, $options: 'i' } }
          }
        },
        { $set: { 'modules.$.completed': true } }
      )
    }

    return res.status(201).json({
      message: 'Module marked as complete',
      progress
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params
    const totalModules = await Module.countDocuments({ courseId })

    const completed = await Progress.countDocuments({ userId: req.user.id, courseId })

    const completePercentage = totalModules
      ? Math.round((completed / totalModules) * 100)
      : 0

    return res.status(200).json({ totalModules, completed, completePercentage })
  } catch (error) {
    return res.status(500).json({ message: 'server Error', error: error.message })
  }
}

module.exports = { markcomplete, getCourseProgress }