const nodemailer = require("nodemailer")
const htmlToText = require("html-to-text")
const pug = require("pug")

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(" ")[0]
    this.url = url
    // this.resetCode = resetCode
    this.from = `iheb <${process.env.EMAIL_FROM}>`
  }

  newTransport() {
    if (process.env.NODE_ENV === "development") {
      // Sendgrid
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      })
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    })
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      // resetCode: resetCode,
      subject,
    })

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html),
    }

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome() {
    await this.send(
      "welcome",
      "Welcome with us to the best journey in your life  !"
    )
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 20 minutes)"
    )
  }
}

// & sending email with node mailer
// const sendEmail = async (options) => {
//   // ! options : the email address we want to send an email to , the subject line, the email content

//   // ! 1) create a transporter : service that will send the email
//   const transporter = nodemailer.createTransport({
//     // options in there
//     // ^ service: 'Gmail', if we want to work with gmail
//     // ^ auth: {
//     // ^  user: process.env.GMAIL_USER,
//     // ^  pass: process.env.GMAIL_PASSWORD
//     // ^ }
//     // * activate in gmail "less secure app" in gmail

//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   })

//   // ! 2) define the email options

//   const mailOptions = {
//     from: "iheb <test@gmail.com> ",
//     to: options.email, // * options : coming as an argument from the options parameter the one we passed in sendEmail parameter's function
//     subject: options.subject,
//     text: options.message,
//     // html :
//   }

//   // ! 3) actually send the email
//   await transporter.sendMail(mailOptions, (err, info) => {
//     if (err) {
//       console.log(err)
//     }
//     console.log(info)
//   })
// }

// module.exports = sendEmail
