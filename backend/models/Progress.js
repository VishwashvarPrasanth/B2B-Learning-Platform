const mongoose = require('mongoose')

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    courseId:{
        type: mongoose.Schema.Types.ObjectId,
        ref : 'Course',
        required : true
    },
    moduleId: {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Module',
        required : true
    },
    completedAt:{
        type: Date,
        default : Date.now
    },
    
},
{timestamps : true})

module.exports = mongoose.model('Progress',progressSchema);

// userId      → ObjectId, ref User, required
// courseId    → ObjectId, ref Course, required
// moduleId    → ObjectId, ref Module, required
// completedAt → Date, default Date.now