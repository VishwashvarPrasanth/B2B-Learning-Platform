const { Worker } = require('bullmq')
const { createConnection } = require('./connection')
const { sendWelcomeEmail } = require('../utils/mailer')

const emailWorker = new Worker('emailQueue', async (job) => {
    console.log('Worker picked up job:', job.name)
    const { to, name, roadmap } = job.data

    if(job.name === 'sendWelcomeEmail') {
        await sendWelcomeEmail(to, name, roadmap)
    }    
},{ connection: createConnection() })

emailWorker.on('completed', (job) =>{
    console.log(`Email job ${job.id} completed`)
})

emailWorker.on('failed', (job,err)=>{
    console.log(`Email job ${job.id} failed`, err.message)
})

module.exports = { emailWorker }