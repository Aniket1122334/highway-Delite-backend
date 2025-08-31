const nodemailer = require("nodemailer");

// transporter config
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Gmail use kar rahe ho toh yeh host
  port: process.env.EMAIL_PORT, // TLS ke liye port
  secure: true, // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // apna email
    pass: process.env.EMAIL_PASS, // apna email ka app password
  },
});

// email bhejne ka function
const sendMail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"HighwayDelite" <${process.env.EMAIL_USER}>`, // sender
      to, // receiver email
      subject, // subject
      text, // plain text body
      html, // html body
    });
    return info;
  } catch (error) {
    console.error("Error sending email: ", error);
    throw error;
  }
};

module.exports = sendMail;
