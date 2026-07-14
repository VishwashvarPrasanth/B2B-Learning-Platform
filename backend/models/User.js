// models == blueprint or template how actually it could structured

const mongoose = require('mongoose')
//  here we designed a schema 
// major things to create type , required - used for it must be needed 
// mongodb - supports multiple datatypes - String ,    => date, objectId , buffer - which specifically have in BSON 
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)