const mongoose = require('mongoose')

const moduleSchema = new mongoose.Schema({
    courseId: {
        type : mongoose.Schema.Types.ObjectId,
        ref :'Course',
        required : true
    },
    title :{
        type: String,
        required:true
    },
    description:{
        type: String
    },
    contentUrl:{
        type: String
    },
    duration:{
        type: Number
    },
    order:{
        type: Number,
        required: true
    },
    skillTag:{
        type: String,
        required: true
    },
    difficulty:{
        type: String,
        enum :['beginner', 'intermediate', 'advanced'],
        default:'beginner'
    }
},
{timestamps: true})

module.exports = mongoose.model('Module',moduleSchema)

// courseId    → ObjectId, ref Course, required
// title       → String, required
// description → String
// contentUrl  → String
// duration    → Number
// order       → Number, required
// skillTag    → String, required
// difficulty  → String, enum ['beginner','intermediate','advanced'], default 'beginner'