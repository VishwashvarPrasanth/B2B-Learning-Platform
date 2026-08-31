const UserCourse = require('../models/UserCourse')
const Course = require('../models/Course')
const User = require('../models/User')

// user enrolls in a course
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    const enrollment = await UserCourse.findOneAndUpdate(
      { userId: req.user.id, courseId },
      { userId: req.user.id, courseId },
      { upsert: true, new: true }
    )

    // save onboarding step — user chose course, now needs assessment
    await User.findByIdAndUpdate(req.user.id, {
      onboardingStep: 'assessment',
      onboardingCourseId: courseId
    })

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment,
      courseId
    })
  } catch (error) {
      console.log('ENROLLMENT ERROR:', error.message)

    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// get all published courses with enrollment status
const getCoursesWithEnrollment = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })

    // check which ones user is enrolled in
    const enrollments = await UserCourse.find({ userId: req.user.id })
    const enrolledCourseIds = enrollments.map(e => e.courseId.toString())

    const coursesWithStatus = courses.map(course => ({
      ...course.toObject(),
      isEnrolled: enrolledCourseIds.includes(course._id.toString())
    }))

    res.status(200).json({ courses: coursesWithStatus })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { enrollCourse, getCoursesWithEnrollment }