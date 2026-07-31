const { Queue } = require('bullmq')
const { createConnection } = require('./connection')

const emailQueue = new Queue('emailQueue', { createConnection })

module.exports = { emailQueue }

