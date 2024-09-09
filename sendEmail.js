require("dotenv").config();
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");

const templatePath = path.join(__dirname, "templates", "emailTemplate.ejs");

// Data voor in de template
const templateData = {
  name: "Jan",
  email: "jan@example.com",
  message: "Dit is een voorbeeldbericht met variabelen.",
};

// Instellen van je mailgegevens
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

ejs.renderFile(templatePath, templateData, (err, html) => {
  if (err) {
    console.log("Er ging iets mis bij het renderen van de template:", err);
    return;
  }

  // Email opties
  let mailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.TO,
    subject: "Automatisch Bericht",
    html: html,
  };

  // Verstuur de email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Er is een fout opgetreden: ", error);
    } else {
      console.log("E-mail verzonden: " + info.response);
    }
  });
});
