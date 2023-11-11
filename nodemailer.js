/* eslint-disable no-undef */
const node = require("nodemailer");
require("dotenv").config("./config.env");
// const random = Math.floor(1000+Math.random()*9000);
module.exports = async (email, subject, text) => {
  const transporter = node.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.email,
      pass: process.env.Password,
    },
  });

  let messagedetail = {
    from: process.env.email,
    to: email,
    subject: subject,
    text: text,
  };

  await transporter.sendMail(messagedetail, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      console.log("Email Sent Successfully");
      console.log(data);
    }
  });
};
