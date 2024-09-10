require("dotenv").config();
const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const axios = require("axios");

// Function om de sessionKey op te halen via een POST-verzoek
async function getSessionKey() {
  try {
    const response = await axios.post(
      "https://api.easytrack.nl/rest/sessions/open",
      {
        organisation: process.env.ORG,
        username: process.env.USER,
        password: process.env.PASS,
      }
    );
    return response.data.sessionId; // Return de sessionKey uit de response
  } catch (error) {
    console.error("Fout bij het ophalen van sessionKey:", error);
    throw error;
  }
}

// Function om de benodigde data op te halen met de sessionKey
async function getData(sessionKey) {
  try {
    const response = await axios.get(
      "https://api.easytrack.nl/rest/vehicles/current-statuses",
      {
        headers: {
          SessionId: `${sessionKey}`, // Gebruik de sessionKey in de headers
        },
      }
    );
    return response.data; // Return de opgehaalde data
  } catch (error) {
    console.error("Fout bij het ophalen van data:", error);
    throw error;
  }
}

async function sendEmail() {
  try {
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

    // haal de sessionKey op
    const sessionKey = await getSessionKey();
    const data = await getData(sessionKey);

    //get right data
    var o = data.find((o) => o.vehicle.code === process.env.LICENSE);

    // Pad naar de ejs template
    const templatePath = path.join(__dirname, "templates", "emailTemplate.ejs");
    const templateData = {
      license: o.vehicle.code,
      status: o.activityStatus.name,
      eta: `${new Date(o.etaStatus.eta || "").toLocaleString()}`,
      destination: `${o.etaStatus.address.street || "Unknown"}, ${
        o.etaStatus.address.zipCode || "Unknown"
      } ${o.etaStatus.address.city || "Unknown"} ${
        o.etaStatus.address.country || "Unknown"
      }`,
      latitude: o.position.latitude,
      longitude: o.position.longitude,
      update: new Date(o.positionLastUpdate).toLocaleString(),
    };

    ejs.renderFile(templatePath, templateData, (err, html) => {
      if (err) {
        console.log("Er ging iets mis bij het renderen van de template:", err);
        return;
      }

      // Email opties
      let mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.TO.split(" "),
        subject: "Update from our truck: " + process.env.LICENSE,
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
  } catch (error) {
    console.error("Er is een fout opgetreden tijdens het proces:", error);
  }
}

sendEmail();
