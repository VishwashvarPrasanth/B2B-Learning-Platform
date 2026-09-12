// // What It Needs Do
// 1. createCourse   → admin creates a course
// 2. addModule      → admin adds module to a course
// 3. getCourses     → get all published courses
// 4. getCourseWithModules → get one course with all its modules

const Course = require("../models/Course"); 
const Module = require("../models/Module")

const createCourse = async (req, res) => {
    try {
        const { title , description } = req.body;
        const createdBy = req.user.id;
        const course = await Course.create({
            title,
            description,
            createdBy
        })

        res.status(201).json({
            message: 'Course created succesfully',
            course 
        })
    }catch(error){
        res.status(500).json({ message : 'Server error', error: error.message})
    }
}

const addModule = async (req,res) =>{
    try{
        const { courseId } = req.params;

        // module fields come from req.body

        const { title , description, contentUrl, duration, order , skillTag, difficulty } = req.body;

        // first check if course exists
        const course = await Course.findById(courseId);
        if(!course){
            return res.status(404).json({message : 'Course not found'});
        }
        const newModule = await Module.create({ courseId, title, description, contentUrl, duration, order, skillTag, difficulty })
        res.status(201).json({ message: 'Module added successfully', module: newModule })

    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message })
    }
}


const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true})
    res.status(200).json({courses})
    // find all published courses
    // send them back
  } catch(error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const getCourseWithModules = async (req, res) =>{
    try{
        const { courseId } = req.params
        const course = await Course.findById(courseId)
        if(!course){
            return res.status(404).json({message:'Course not found'})
        }
        const modulef = await Module.find({ courseId }).sort({ order: 1 })
        // after fetching both, add this:
        res.status(200).json({ course, modules: modulef })

    }catch(error){
        return res.status(500).json({message:'Server Error', error : error.message})
    }
} 
// delete course
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    await Course.findByIdAndDelete(courseId)
    await Module.deleteMany({ courseId })
    res.status(200).json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// update course
const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params
    const { title, description, isPublished } = req.body
    const course = await Course.findByIdAndUpdate(
      courseId,
      { title, description, isPublished },
      { new: true }
    )
    res.status(200).json({ message: 'Course updated', course })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// delete module
const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params
    await Module.findByIdAndDelete(moduleId)
    res.status(200).json({ message: 'Module deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
// admin — update module
const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params
    const { title, description, contentUrl, duration, order, skillTag, difficulty } = req.body

    const module = await Module.findByIdAndUpdate(
      moduleId,
      { title, description, contentUrl, duration, order, skillTag, difficulty },
      { new: true }
    )

    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    res.status(200).json({ message: 'Module updated', module })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { createCourse, addModule, getCourses, getCourseWithModules, deleteCourse, updateCourse, deleteModule, updateModule }