const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Ensure email credentials exist
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment variables!");
    process.exit(1);
}

// Create the transporter using Gmail SMTP explicitly
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",        // Gmail SMTP host
    port: 587,                     // Try 465 (SSL) or 587 (TLS)
    secure: false,                  // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password
    },
});

// Verify connection
transporter.verify((error) => {
    if (error) {
        console.error("❌ Email setup error:", error);
    } else {
        console.log("✅ Email setup successful!");
    }
});

// Function to send an email
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: `"Aquasense" <${process.env.EMAIL_USER}>`, // Sender name
            to,
            subject,
            text,
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.response}`);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;
