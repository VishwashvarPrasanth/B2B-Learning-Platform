const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
    title:{
        type: String,
        required : true
    },
    description:{
        type: String,
        required : true
    },
    createdBy:{
        type : mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    },
    isPublished :{
        type : Boolean,
        default: false
    }
},
{timestamps: true})

module.exports = mongoose.model('Course',courseSchema)

// title       → String, required
// description → String, required
// createdBy   → ObjectId, ref User, required
// isPublished → Boolean, default false