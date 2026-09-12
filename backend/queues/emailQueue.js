const { Queue } = require('bullmq')
const { createConnection } = require('./connection')

const emailQueue = new Queue('emailQueue', { connection: createConnection() })

module.exports = { emailQueue }

