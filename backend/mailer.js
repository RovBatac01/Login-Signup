const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Ensure email credentials exist
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ Missing EMAIL_USER or EMAIL_PASS in environment variables!");
    process.exit(1);
}

// Create the transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password (not Gmail password)
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
            from: `"Aquasense" <${process.env.EMAIL_USER}>`, // Set a sender name
            to,
            subject,
            text,
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.response}`);
        return info; // Return response for debugging
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;
