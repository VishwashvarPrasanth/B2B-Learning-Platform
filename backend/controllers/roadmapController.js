const Groq = require('groq-sdk')
const User = require('../models/User')
const Roadmap = require('../models/Roadmap')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const generateRoadmap = async (req, res) => {
  try {
    // Step 1 - get user and their assessment scores
    const user = await User.findById(req.user.id)

    if (!user.metadata || !user.metadata.assessmentDone) {
      return res.status(400).json({
        message: 'Please complete the assessment first'
      })
    }

    const scores = user.metadata.scores

    // Step 2 - available course modules
    const availableModules = [
      { topic: 'HTML', level: 'beginner' },
      { topic: 'HTML', level: 'intermediate' },
      { topic: 'CSS', level: 'beginner' },
      { topic: 'CSS', level: 'intermediate' },
      { topic: 'CSS Flexbox', level: 'intermediate' },
      { topic: 'CSS Grid', level: 'advanced' },
      { topic: 'JavaScript', level: 'beginner' },
      { topic: 'JavaScript', level: 'intermediate' },
      { topic: 'JavaScript', level: 'advanced' },
      { topic: 'React', level: 'beginner' },
      { topic: 'React', level: 'intermediate' },
      { topic: 'Node.js', level: 'beginner' },
      { topic: 'Node.js', level: 'intermediate' },
      { topic: 'MongoDB', level: 'beginner' },
      { topic: 'MongoDB', level: 'intermediate' }
    ]

    // Step 3 - build prompt
    const prompt = `
You are a personalized learning path generator.

A student has completed an assessment with these scores:
${JSON.stringify(scores, null, 2)}

Score meaning:
- 0-40%   → weak, needs beginner content
- 41-70%  → medium, needs intermediate content  
- 71-100% → strong, can skip basics, go advanced

Available course modules:
${JSON.stringify(availableModules, null, 2)}

Based on the scores, generate a personalized learning roadmap.
- Skip modules the student already knows well (above 80%)
- Include beginner modules for weak topics (below 40%)
- Include intermediate modules for medium topics (41-70%)

Return ONLY a valid JSON array, no extra text, no markdown:
[
  {
    "topic": "CSS",
    "level": "beginner",
    "reason": "Student scored 40% in CSS, needs basics first",
    "order": 1
  }
]
`

    // Step 4 - call Groq
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })

    const text = completion.choices[0].message.content

    // Step 5 - parse response
    const cleanText = text.replace(/```json|```/g, '').trim()
    const modules = JSON.parse(cleanText)

    // Step 6 - save roadmap in DB
    const roadmap = await Roadmap.create({
      userId: req.user.id,
      modules
    })

    res.status(201).json({
      message: 'Roadmap generated successfully',
      roadmap
    })
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    })
  }
}

const getRoadmap = async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.id })

    if (!roadmap) {
      return res.status(404).json({ message: 'No roadmap found' })
    }

    res.status(200).json({ roadmap })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

module.exports = { generateRoadmap, getRoadmap }