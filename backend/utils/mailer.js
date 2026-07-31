const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

const sendWelcomeEmail = async (to , name , roadmap) => {
    const moduleList = roadmap.modules.map(m => `<li>${m.topic} - ${m.level} (${m.reason})</li>`).join('')

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Your Personalized Learning Path is Ready!`,
        html: `
        <h2>Welcome ${name}!</h2>
        <p>Based on Your assessment, here is your personalized learning path:</p>
        <ul>${moduleList}</ul>
        <p>Login to your dashboard to start learning. </p>
        `
    }
    await transporter.sendMail(mailOptions)
    console.log('Welcome email send to:', to)
}

module.exports = { sendWelcomeEmail }