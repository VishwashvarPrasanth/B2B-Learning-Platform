const Groq = require('groq-sdk')
const User = require('../models/User')
const Course = require('../models/Course')
const Module = require('../models/Module')
const Roadmap = require('../models/roadmap')
const { sendWelcomeEmail } = require('../utils/mailer')

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})


const generateRoadmap = async (req, res) => {
  try {
    const { courseId } = req.body

    if (!courseId) {
      return res.status(400).json({
        message: 'courseId is required'
      })
    }

    // STEP 1: Get user

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      })
    }

    // STEP 2: Check assessment

    if (
      !user.metadata?.assessmentDone ||
      !user.metadata?.assessmentCourseId ||
      user.metadata.assessmentCourseId.toString() !== courseId.toString()
    ) {
      return res.status(400).json({
        message: 'Please complete the assessment for this course first'
      })
    }

    const scores = user.metadata.scores || {}

    console.log('Assessment scores:', scores)

    // STEP 3: Check course

    const course = await Course.findById(courseId)

    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      })
    }

    // STEP 4: Get modules for THIS course

    const courseModules = await Module.find({
      courseId: courseId
    }).sort({ order: 1 })

    if (courseModules.length === 0) {
      return res.status(400).json({
        message: 'No modules found for this course'
      })
    }

    console.log(
      'Course modules:',
      courseModules.map(module => ({
        title: module.title,
        skillTag: module.skillTag,
        order: module.order
      }))
    )

    // STEP 5: Get unique topics from course modules

    const topics = [
      ...new Set(
        courseModules
          .map(module => module.skillTag)
          .filter(Boolean)
      )
    ]

    console.log('Course topics:', topics)

    // STEP 6: Decide which topics the user needs
    //
    // More than 80% = SKIP
    // 80% or below = INCLUDE

    const requiredTopics = []

    for (const topic of topics) {

      // Find score even if capitalization is different
      const scoreKey = Object.keys(scores).find(
        key =>
          key.trim().toLowerCase() ===
          topic.trim().toLowerCase()
      )

      const score = scoreKey
        ? scores[scoreKey]
        : 0

      console.log(
        `Topic: ${topic} | Score: ${score}%`
      )

      // More than 80% means user already knows it
      if (score <= 80) {
        requiredTopics.push({
          topic,
          score
        })
      }
    }


    console.log(
      'Topics required for roadmap:',
      requiredTopics
    )

    // STEP 7: If user knows everything

    if (requiredTopics.length === 0) {

      const roadmap = await Roadmap.findOneAndUpdate(
        {
          userId: req.user.id,
          courseId
        },
        {
          userId: req.user.id,
          courseId,
          modules: []
        },
        {
          new: true,
          upsert: true
        }
      )

      return res.status(201).json({
        message: 'You already have strong knowledge in all topics',
        roadmap
      })
    }

    // STEP 8: Send ONLY required topics to AI

    const prompt = `
          You are a personalized learning roadmap generator.

          Course:
          ${course.title}

          The student completed an assessment for this course.

          The backend has already calculated the topic scores.

          IMPORTANT RULE:
          - If score is MORE THAN 80%, the topic is already known and MUST NOT be included.
          - If score is 80% or below, the topic SHOULD be included.
          - Do NOT create new topics.
          - Do NOT add topics that are not present in the input.
          - Use ONLY the topics provided below.
          - Arrange the topics in a logical learning order.

          Topics the student needs to learn:

          ${JSON.stringify(requiredTopics, null, 2)}

          Return ONLY valid JSON.

          Format:

          [
            {
              "topic": "topic name",
              "reason": "short explanation",
              "order": 1
            }
          ]
          `

    // STEP 9: Call Groq

    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',

      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],

      temperature: 0.3
    })

    console.log('Groq response received')

    // STEP 10: Parse AI response

    const text = completion.choices[0].message.content

    console.log('Raw AI response:', text)

    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const modules = JSON.parse(cleanText)

    // STEP 11: Save roadmap

    const roadmap = await Roadmap.findOneAndUpdate(
      {
        userId: req.user.id,
        courseId
      },
      {
        userId: req.user.id,
        courseId,
        modules
      },
      {
        new: true,
        upsert: true
      }
    )
    // STEP 12: Mark onboarding as completed
    await User.findByIdAndUpdate(req.user.id, {
      onboardingStep: 'completed'
    })
    // STEP 12: Send email

   console.log('Queuing welcome email for:', user.email)

      try {
        await emailQueue.add('sendWelcomeEmail', {
          to: user.email,
          name: user.name,
          roadmap
        })
        console.log('Email job queued for:', user.email)
      } catch (err) {
        console.log('Failed to queue email job:', err.message)
      }

    // STEP 13: Response
    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap
    })

  } catch (error) {

    console.log(
      'ROADMAP ERROR:',
      error.message
    )

    console.log(
      'ROADMAP STACK:',
      error.stack
    )

    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}


// GET ROADMAP FOR ONE COURSE

const getRoadmap = async (req, res) => {
  try {

    const { courseId } = req.query

    if (!courseId) { return res.status(400).json({   message: 'courseId is required' }) }

    const roadmap = await Roadmap.findOne({ userId: req.user.id, courseId })

    if (!roadmap) {
      return res.status(404).json({ message: 'No roadmap found for this course'})
      }

    res.status(200).json({ roadmap })

  } catch (error) {

    console.log('GET ROADMAP ERROR:',error.message)
    res.status(500).json({ message: 'Server error',error: error.message })
  }
}

// GET ALL ROADMAPS

const getAllRoadmaps = async (req, res) => {
  try {

    console.log('GET ALL ROADMAPS')
    console.log('User ID:', req.user?.id)

    const roadmaps = await Roadmap.find({ userId: req.user.id })
    console.log( 'Roadmaps found:', roadmaps )
    res.status(200).json({ roadmaps })
  } catch (error) {

    console.log('GET ALL ROADMAPS ERROR:',error.message)
    console.log('GET ALL ROADMAPS STACK:',error.stack)
    res.status(500).json({ message: 'Server error',error: error.message })
  }
}

module.exports = { generateRoadmap, getRoadmap,getAllRoadmaps }
