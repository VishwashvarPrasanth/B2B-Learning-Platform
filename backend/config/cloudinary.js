const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

// configure cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// configure storage — videos go to b2b-learning folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'b2b-learning/videos',
    resource_type: 'video',  // allows video uploads
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    transformation: [{ quality: 'auto' }]  // auto compress
  }
})

// multer handles file upload, 500MB limit
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }
})

module.exports = { cloudinary, upload }