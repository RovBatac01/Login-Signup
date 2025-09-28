const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Ensure email credentials exist
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "❌ Missing EMAIL_USER or EMAIL_PASS in environment variables!"
  );
  process.exit(1);
}

// Create the transporter using Gmail SMTP explicitly
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",        // Gmail SMTP host
    port: 465,                     // Try 465 (SSL) or 587 (TLS)
    secure: true,                  // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password
    },
});

// Function to send OTP email
// Now accepts 'messageBody' which will already contain the OTP
const sendOtpEmail = async (to, subject, messageBody) => {
  // Changed parameters
  // --- ADDED FOR DEBUGGING ---
  console.log("mailer.js: Received 'to':", to);
  console.log("mailer.js: Received 'subject':", subject);
  console.log(
    "mailer.js: Received 'messageBody' (should contain OTP):",
    messageBody
  );
  // --- END DEBUGGING ---

  const mailOptions = {
    from: `"Aquasense" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: messageBody, // Use the provided messageBody directly
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} with subject: "${subject}"`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = sendOtpEmail;
