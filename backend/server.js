require("dotenv").config();

const db = require("./config/db");
const pool = require ("./config/db");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const router = express.Router();
const nodemailer = require("nodemailer");
const sendOtpEmail = require('./otpMailer');
const crypto = require("crypto");
const sendEmail = require("./mailer");
const { User } = require("./models/user");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const cookieParser = require("cookie-parser");
const authRoutes = require("./models/route");
const sessionHistoryRoutes = require("./routes/sessionHistory");
const SessionHistory = require("./models/sessionHistory");
const app = express();
const port = 5000;
const saltRounds = 10;
const otpGenerator = require('otp-generator');
const JWT_SECRET = process.env.JWT_SECRET;
// const users = [];

const authenticateUser = require('./middleware/authenticateUser');

const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        // 1. Check if user information is available from a previous authentication middleware
        if (!req.user || !req.user.role) {
            console.warn('Authorization attempt failed: User not authenticated or role missing.');
            // This case should ideally be caught by authMiddleware first, but acts as a safeguard.
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No authentication token or role provided.'
            });
        }

        const userRole = req.user.role;

        // 2. Check if the user's role is included in the allowed roles list
        if (allowedRoles.includes(userRole)) {
            // If the user's role is allowed, proceed to the next middleware or route handler
            next();
        } else {
            // If the user's role is not allowed, send a 403 Forbidden response
            console.warn(`Access Denied: User with role '${userRole}' tried to access a restricted resource.`);
            return res.status(403).json({
                success: false,
                message: `Forbidden: You do not have the necessary permissions (required roles: ${allowedRoles.join(', ')}) to access this resource.`
            });
        }
    };
};


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('🔴 authenticateToken: No token provided.');
        return res.sendStatus(401); // No token
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log('🔴 authenticateToken: Invalid token:', err.message);
            return res.sendStatus(403); // Token is no longer valid or tampered
        }
        // Attach the decoded user payload to the request
        req.user = user; 
        console.log('🔵 authenticateToken: Token successfully verified. req.user:', req.user);
        next();
    });
};

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expected format: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // --- THE CRUCIAL CHANGE IS HERE ---
        // Create a 'req.user' object and attach all decoded properties to it.
        // This makes 'req.user.role' accessible for authorizeRoles.
        req.user = { // Attach the decoded payload to req.user
            id: decoded.id,
            role: decoded.role,
            isVerified: decoded.isVerified,
            emailVerified: decoded.emailVerified,
            // ... any other properties you might have in your JWT payload
        };

        console.log('JWT verification successful. User role set to:', req.user.role); // Add for debugging
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

// --- Authentication Middleware (for protected routes) ---
const authenticateAdminRoute = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expected format: "Bearer TOKEN"

    console.log('\n--- AUTHENTICATION MIDDLEWARE START ---');
    console.log('1. Authorization Header Received:', authHeader);
    console.log('2. Extracted Token (first 30 chars):', token ? token.substring(0, 30) + '...' : 'No token found');

    if (!token) {
        console.log('3. Result: No token provided, sending 401.');
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }

    try {
        // Log the JWT secret being used (FOR DEBUGGING ONLY - REMOVE IN PRODUCTION!)
        console.log('4. JWT_SECRET from process.env:', process.env.JWT_SECRET ? '***** (present)' : '!!! JWT_SECRET is MISSING in .env !!!');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('5. Decoded JWT Payload:', decoded); // CRITICAL: Inspect this payload!
        
        // Ensure that 'id' exists in the decoded payload
        if (!decoded || typeof decoded.id === 'undefined' || decoded.id === null) {
            console.error('6. CRITICAL: Decoded JWT payload does not contain "id" property or is invalid.');
            return res.status(403).json({ message: 'Invalid token payload: User ID missing or malformed.' });
        }

        req.userId = decoded.id; // This is where userId is set
        req.userRole = decoded.role; // This is where userRole is set

        console.log('7. req.userId set to:', req.userId);
        console.log('8. req.userRole set to:', req.userRole);

        // Optional: Check if the role is 'Admin' or 'Super Admin' if this middleware
        // is specifically for admin routes.
        if (req.userRole !== 'Admin' && req.userRole !== 'Super Admin') {
            console.log('9. Result: User role not Admin/Super Admin, sending 403.');
            return res.status(403).json({ message: 'Access Denied: Requires Admin or Super Admin role.' });
        }
        console.log('10. Authentication SUCCESS. Proceeding to next.');
        next(); // Proceed to the next middleware/route handler
    } catch (error) {
        console.error('Middleware: JWT verification FAILED:', error.message); // Log specific error message
        // This catch block handles 'JsonWebTokenError' (e.g., secret mismatch, malformed token)
        // and 'TokenExpiredError' (expired token).
        return res.status(403).json({ message: `Invalid or expired token: ${error.message}` });
    } finally {
        console.log('--- AUTHENTICATION MIDDLEWARE END ---\n');
    }
};

// Create the single HTTP server that will handle both Express and Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for the frontend and bridge app
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Debugging Middleware ---
// This will log every incoming request to the server, which can help diagnose routing issues.
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

// Add session history routes
app.use("/api/session-history", sessionHistoryRoutes);

// --- Test Root Endpoint ---
app.get("/", (req, res) => {
  res.status(200).send("Backend is running!");
});
// Example middleware to verify the token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get the token from the 'Authorization' header

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  console.log('🔐 Signing with JWT_SECRET:', process.env.JWT_SECRET);
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }

    // Attach the decoded user data to the request object
    req.user = decoded;
    next(); // Call next middleware or handler
  });
};

// --- NEW Middleware for Super Admin Authorization ---
const authorizeSuperAdmin = (req, res, next) => {
    // req.user is set by verifyToken middleware
    if (req.user && req.user.role === 'Super Admin') {
        next(); // User is a Super Admin, proceed
    } else {
        console.log("Unauthorized access attempt. Role:", req.user ? req.user.role : 'None');
        return res.status(403).json({ message: "Access Denied: Requires Super Admin role" });
    }
};

const authorizeAdmin = (req, res, next) => { // <--- CONSIDER RENAMING THIS FUNCTION
    // req.user is set by verifyToken middleware
    if (req.user && (req.user.role === 'Admin' || req.user.role === 'Super Admin')) { // <--- MODIFIED CONDITION
        next(); // User is an Admin or Super Admin, proceed
    } else {
        console.log("Unauthorized access attempt. Role:", req.user ? req.user.role : 'None');
        // <--- Consider updating the message to reflect the new allowed roles
        return res.status(403).json({ message: "Access Denied: Requires Admin or Super Admin role" });
    }
};

// mailer function
app.post("/send-email", async (req, res) => {
    const { email, subject, message } = req.body; // 'message' will contain a placeholder from frontend

    if (!email) {
        return res.status(400).json({ error: "Email is required." });
    }

    console.log("Backend received email:", email); // Debug: Check received email
    console.log("Backend received message from frontend:", message); // Debug: Check raw message from frontend

    try {
        // 1. Generate OTP
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        console.log("Generated OTP:", otp); // Debug: Check generated OTP

        // 2. Store OTP (verification_code) in the database for the given email
        const [userCheck] = await db.query("SELECT id FROM users WHERE email = ?", [email]);

        if (userCheck.length === 0) {
            return res.status(404).json({ error: "User with this email not found. Cannot send OTP." });
        }

        await db.query("UPDATE users SET verification_code = ?, email_verified = 0 WHERE email = ?", [otp, email]);

        // 3. Send the email with the generated OTP
        const finalMessage = message.replace("[OTP_PLACEHOLDER]", otp); // Replace placeholder with actual OTP

        // Generate a unique subject line to bypass Gmail's caching
        const uniqueSubject = `${subject} - ${new Date().toLocaleString()}`; // <-- ADDED: Unique subject for testing
        console.log("Final message prepared for email:", finalMessage); // Debug: Check message AFTER replacement

        // Pass the unique subject to sendEmail
        const response = await sendEmail(email, uniqueSubject, finalMessage); // <-- MODIFIED: Using uniqueSubject
        res.json({ success: true, message: "OTP sent successfully!", emailResponse: response });
    } catch (error) {
        console.error("Error in /send-email (OTP generation/storage/sending):", error);
        res.status(500).json({ error: "Failed to send OTP. Please try again later." });
    }
});


// verify code function (for email verification)
app.post("/verify-code", async (req, res) => {
  console.log("Received request:", req.body);

  const { email, code } = req.body;
  if (!email || !code) {
    return res
      .status(400)
      .json({ error: "Email and verification code are required." });
  }

  try {
    // Query the database to find the user
    const [results] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = results[0];

    // Check verification code
    if (user.verification_code !== code) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // Update user to set them as email_verified
    const [updateResult] = await db.query("UPDATE users SET email_verified = 1, verification_code = NULL WHERE email = ?", [email]); // Set verification_code to NULL after use

    res.json({ success: true, message: "Email verification successful!" });
  } catch (err) {
    console.error("Database error during email verification:", err);
    res.status(500).json({ error: "Database error during email verification." });
  }
});

// --- Route: Verify Admin/Super Admin OTP ---
app.post("/admin/verify-otp", async (req, res) => {
    console.log("Received admin/super admin verification request:", req.body);
    const { email, code } = req.body;

    if (!email || !code) {
        return res
            .status(400)
            .json({ error: "Email and verification code are required." });
    }

    let connection; // Declare connection here for try/catch/finally scope
    try {
        connection = await db.getConnection(); // Get a connection from the pool

        // Query the database to find the user (admin/super admin)
        // IMPORTANT: Added role check AND `email_verified = FALSE` to ensure we only verify unverified admin accounts
        const [results] = await connection.execute(
            "SELECT id, verification_code, otp_expires, email_verified FROM users WHERE email = ? AND (role = ? OR role = ?) AND email_verified = FALSE",
            [email, 'Admin', 'Super Admin']
        );
        console.log("Database query results for admin verification:", results);

        if (results.length === 0) {
            // User not found, or not an unverified admin, or already verified
            return res.status(404).json({ error: "Admin/Super Admin user not found or already verified." });
        }

        const user = results[0];
        console.log("Admin user found in DB for verification:", user);
        console.log("Stored verification code in DB (admin):", user.verification_code);
        console.log("Code received from frontend (admin):", code);
        console.log("Stored OTP Expiry (admin):", user.otp_expires); // Log expiry for debugging

        // 1. Check verification code
        if (user.verification_code !== code) {
            console.log("OTP Mismatch (admin): Stored:", user.verification_code, "Received:", code);
            return res.status(400).json({ error: "Invalid verification code." });
        }

        // 2. Check if OTP has expired
        const currentDateTime = new Date();
        const otpExpiryDateTime = new Date(user.otp_expires); // Convert DB datetime string to Date object

        if (currentDateTime > otpExpiryDateTime) {
            console.log("OTP Expired (admin): Current:", currentDateTime, "Expiry:", otpExpiryDateTime);
            // Optionally clear the expired OTP to prevent re-attempts with old codes
            await connection.execute('UPDATE users SET verification_code = NULL, otp_expires = NULL WHERE id = ?', [user.id]);
            return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
        }

        // All checks passed: Update user to set them as email_verified and clear the verification code and expiry
        const [updateResult] = await connection.execute(
            "UPDATE users SET email_verified = 1, verification_code = NULL, otp_expires = NULL WHERE id = ?", // Clear expiry too
            [user.id] // Use user.id for safer update
        );
        console.log("Admin user email verified and code/expiry cleared:", updateResult);

        res.json({ success: true, message: "Admin/Super Admin email verification successful!" });
    } catch (err) {
        console.error("Database error during admin email verification:", err);
        res.status(500).json({ error: "Server error during admin email verification." }); // More generic error message for client
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
        }
    }
});

// Function to validate password (added)
const validatePassword = (password) => {
  // Password must be at least 8 characters long
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  // Password must contain at least one number
  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }
  // Password must contain at least one special character
  // This regex matches common special characters.
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) {
    return "Password must contain at least one special character.";
  }
  return null; // Password is valid
};

// Signup function
app.post("/users", async (req, res) => {
  const {
    username,
    email,
    phone,
    password,
    confirmPassword,
    role = "User",
  } = req.body;

  // Add this line to log the password
  console.log("Password accepted:", password);

  if (!username || !email || !phone || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const verificationCode = crypto.randomInt(100000, 999999).toString(); // Generate 6-digit code

    const sql =
      "INSERT INTO users (username, email, phone, password_hash, role, verification_code, is_verified, email_verified) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)"; // Added email_verified

    const [result] = await db.query(
      sql,
      [username, email, phone, hashedPassword, role, verificationCode, 0, 0] // Set email_verified to 0 (false) initially
    );

    try {
      await sendVerificationEmail(email, verificationCode);
      res.json({
        message:
          "User registered successfully. Check your email for verification.",
        userId: result.insertId,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      res.status(500).json({ error: "Failed to send verification email, but user registered. Please contact support." });
    }
  } catch (error) {
    console.error("Error during signup process:", error);
    if (error.code && error.code.startsWith('ER_')) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "User with this username or email already exists." });
        }
        return res.status(500).json({ error: "Database error during signup." });
    }
    res.status(500).json({ error: "Server error during signup." });
  }
});

// Function to send verification email
async function sendVerificationEmail(to, code) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Email Verification Code",
    text: `Your verification code is: ${code}`,
  };

  await transporter.sendMail(mailOptions);
}

// Login function
app.post("/login", async (req, res) => {
  console.log("Received Data:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "SELECT id, username, role, password_hash, is_verified, email_verified, device_id FROM users WHERE username = ?"; // IMPORTANT: Select device_id here

  try {
    const [results] = await db.query(sql, [username]);

    if (results.length === 0) {
      console.log("Login attempt: User not found.");
      return res.status(400).json({ error: "User not found" });
    }

    const user = results[0];
    // --- NEW DEBUG LOG ---
    console.log(`Backend Debug: User object directly from DB query for ${user.username}:`, user);
    // --- END NEW DEBUG LOG ---

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log("Login attempt: Incorrect password for user:", username);
      return res.status(400).json({ error: "Incorrect password" });
    }

    if (user.email_verified === 0) {
      return res.status(403).json({ error: "Please verify your email address first." });
    }

    // --- IMPORTANT: Fetch the establishment ID and DEVICE ID for the User/Admin ---
    let associatedEstablishmentId = null;
    let associatedDeviceId = null; 

    if (user.role === "Admin") {
      const [adminAssignments] = await db.query(
        `SELECT ae.establishment_id, e.device_id
         FROM admin_establishments ae
         JOIN estab e ON ae.establishment_id = e.id
         WHERE ae.user_id = ?`,
        [user.id]
      );

      if (adminAssignments.length > 0) {
        associatedEstablishmentId = adminAssignments[0].establishment_id;
        associatedDeviceId = adminAssignments[0].device_id; 
        console.log(`Backend Debug: Admin user ${user.username} (ID: ${user.id}) assigned establishmentId: ${associatedEstablishmentId}, deviceId: ${associatedDeviceId}`);
      } else {
        console.warn(`Backend Debug: Admin user ${user.username} (ID: ${user.id}) has no assigned establishments.`);
      }
    } else if (user.role === "User") { 
        // For 'User' role, directly use the device_id from the 'users' table
        associatedDeviceId = user.device_id; // Directly assign from the fetched user object
        
        // If a User is also linked to an establishment, you might still want to fetch that
        // However, based on your schema, it's not directly in the 'users' table.
        // If you intend for users to have an establishment, Option 1 (modifying schema) is better.
        // For now, we'll keep establishmentId as null for regular users if it's not in the users table
        // or fetched via a join.

        console.log(`Backend Debug: User ${user.username} (ID: ${user.id}) directly using deviceId: ${associatedDeviceId}`);
    }


    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        isVerified: user.is_verified,
        emailVerified: user.email_verified,
        establishmentId: associatedEstablishmentId,
        deviceId: associatedDeviceId 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log('🔐 Signing with JWT_SECRET:', process.env.JWT_SECRET);
    console.log("Backend: Generated Auth Token for user:", token);

    let redirectUrl = "/dashboard";
    if (user.role === "Admin") {
      redirectUrl = "/adminDB";
    } else if (user.role === "User") {
      redirectUrl = "/userDB";
    }

    const userForFrontend = {
      id: user.id,
      username: user.username,
      role: user.role,
      isVerified: user.is_verified === 1,
      emailVerified: user.email_verified === 1,
      establishmentId: associatedEstablishmentId,
      deviceId: associatedDeviceId 
    };

    console.log("Backend Debug: userForFrontend object being sent:", userForFrontend);

    // Record the login in session history
    try {
      // Get IP address
      const ipAddress = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress || 
                      req.connection.socket.remoteAddress;
      
      // Get device info from user agent
      const deviceInfo = req.headers['user-agent'];

      await SessionHistory.recordSession(
        user.id,
        user.username,
        'login',
        ipAddress,
        deviceInfo
      );
      console.log(`Session history recorded for user ${user.username} (login)`);
    } catch (error) {
      console.error("Error recording session history:", error);
      // Don't fail the login if session history recording fails
    }

    res.json({
      message: "Login successful",
      user: userForFrontend,
      token: token,
      role: user.role,
      redirectUrl: redirectUrl,
    });

  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Server error during login." });
  }
});



// Create admin
// --- Route: Create Admin Account (and assign to multiple establishments) ---
app.post('/admin', async (req, res) => {
    const { username, email, password, confirmPassword, role, establishmentIds } = req.body;

    // Basic validation
    if (!username || !email || !password || !confirmPassword || !role) {
        return res.status(400).json({ error: "Username, email, password, confirmPassword, and role are required." });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
    }

    // Role validation
    if (role !== 'Admin' && role !== 'Super Admin') {
        return res.status(400).json({ error: "Invalid role specified. Must be 'Admin' or 'Super Admin'." });
    }

    // Establishment validation (only required for Admin)
    if (role === 'Admin') {
        if (!establishmentIds || !Array.isArray(establishmentIds) || establishmentIds.length === 0) {
            return res.status(400).json({ error: "Admin must be assigned to at least one establishment." });
        }
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Check if user already exists
        const [existingUser] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            await connection.rollback();
            return res.status(409).json({ error: "User with this email already exists." });
        }

        // 2. If Admin, validate Establishment IDs
        if (role === 'Admin') {
            for (const id of establishmentIds) {
                if (typeof id !== 'number' && typeof id !== 'string' || isNaN(parseInt(id))) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Invalid establishment ID type: ${id}` });
                }
                const [estCheck] = await connection.execute('SELECT id FROM estab WHERE id = ?', [id]);
                if (estCheck.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: `Establishment with ID ${id} not found.` });
                }
            }
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generate OTP
        const otpCode = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        // 5. Insert user
        const [insertResult] = await connection.execute(
            "INSERT INTO users (username, email, password_hash, role, email_verified, verification_code, otp_expires) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [username, email, hashedPassword, role, 0, otpCode, otpExpiresAt]
        );
        const userId = insertResult.insertId;

        // 6. Assign establishments
        if (role === 'Super Admin') {
            // Assign ALL establishments
            const [allEstabs] = await connection.execute("SELECT id FROM estab");
            for (const est of allEstabs) {
                await connection.execute(
                    "INSERT INTO admin_establishments (user_id, establishment_id) VALUES (?, ?)",
                    [userId, est.id]
                );
            }
        } else {
            // Assign only chosen ones
            for (const establishmentId of establishmentIds) {
                await connection.execute(
                    "INSERT INTO admin_establishments (user_id, establishment_id) VALUES (?, ?)",
                    [userId, establishmentId]
                );
            }
        }

        // 7. Send OTP email
        const subject = role === 'Super Admin' 
            ? "Verify Your Super Admin Account Email" 
            : "Verify Your Admin Account Email";
        const messageBody = `Your verification code for your ${role} account is: ${otpCode}. This code is valid for 10 minutes.`;
        
        await sendEmail(email, subject, messageBody);
        console.log(`OTP email sent to ${email}`);

        await connection.commit();

        res.status(201).json({
            message: `${role} account created successfully! Please verify your email with the OTP sent.`,
            userId: userId
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Admin creation error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "Email or username already exists." });
        }
        res.status(500).json({ error: "Failed to create account." });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// fetch users
app.get("/api/users", async (req, res) => {
  try {
    // Fetch email_verified along with other user data
    const [users] = await db.query("SELECT id, username, email, role, is_verified, email_verified FROM users");
    res.json(users);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ error: "Database error while fetching users" });
  }
});

// delete
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Corrected: Use await db.query directly, remove .promise()
    const [user] = await db.query("SELECT role FROM users WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = user[0].role;

    if (userRole === "Super Admin") {
      // Corrected: Use await db.query directly, remove .promise()
      const [superAdmins] = await db.query(
        'SELECT COUNT(*) AS count FROM users WHERE role = "Super Admin"'
      );

      if (superAdmins[0].count <= 1) {
        return res
          .status(403)
          .json({ error: "Cannot delete the last Super Admin" });
      }
    }

    // Corrected: Use await db.query directly, remove .promise()
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// edit account
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email, phone } = req.body;

  try {
    // Ensure the ID is a valid number
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Ensure all required fields are provided
    if (!username || !email) {
      return res.status(400).json({ error: "Username and email are required" });
    }

    // Log the received data for debugging
    console.log(`🔹 Updating user ID: ${userId}, Data:`, {
      username,
      email,
      phone,
    });

    // Perform the update query
    // Corrected: Use await db.query directly, remove .promise()
    const [result] = await db.query(
      "UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?",
      [username, email, phone || null, userId]
    );

    // Check if any rows were updated
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "User not found or no changes made" });
    }

    // Successfully updated user
    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res
      .status(500)
      .json({ error: "Failed to update user. Please try again later." });
  }
});

// Forgot password route (OTP generation and sending)
app.post('/api/forgot-password', async (req, res) => { // 'async' is already there, good!
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }

  // Generate a 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  // Store OTP in database or a temporary storage for validation
  const sql = 'UPDATE users SET reset_otp = ?, otp_expires = ? WHERE email = ?';
  const expiration = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  try { // Added try-catch for the database operation
    const [result] = await db.query(sql, [otp, expiration, email]); // Corrected: Await db.query

    if (result.affectedRows === 0) {
      // If no user found, return 404 but don't expose if email exists for security
      return res.status(404).json({ message: 'If a user with that email exists, an OTP has been sent.' });
    }

    // Send OTP email to the user
    await sendOtpEmail(email, otp, 'reset-password'); // sendOtpEmail should be async
    res.status(200).json({
      message: 'OTP sent to your email. Please check your inbox.',
    });
  } catch (emailError) { // Catch block for email sending errors
    console.error('Error sending OTP email or updating OTP:', emailError);
    res.status(500).json({ message: 'Failed to send OTP or store it. Please try again later.' });
  }
});

// validate otp (Fixed typo from 'validtae itp' to 'validate otp')
app.post('/api/validate-otp', async (req, res) => { // Added 'async'
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  const querySql = `SELECT reset_otp, otp_expires FROM users WHERE email = ?`; // Changed 'query' to 'querySql' for clarity
  try { // Added try-catch
    const [results] = await db.query(querySql, [email]); // Corrected: Await db.query

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = results[0];
    const currentTime = new Date();
    const otpExpiration = new Date(user.otp_expires);

    if (user.reset_otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    if (currentTime > otpExpiration) {
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (err) {
    console.error('Database error during OTP validation:', err);
    return res.status(500).json({ message: 'Database error.' });
  }
});

// Route to reset the password after OTP verification
app.post("/api/reset-password", async (req, res) => { // 'async' is already there, good!
  const { newPassword, confirmPassword } = req.body;

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log("Received token:", token);
  console.log("Using JWT_SECRET:", process.env.JWT_SECRET);

  if (!token) {
    console.log("No token provided.");
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    console.log("Token decoded, userId:", userId);

    if (!newPassword || !confirmPassword) {
      console.log("Missing passwords.");
      return res.status(400).json({ message: "Both new password and confirm password are required." });
    }

    if (newPassword !== confirmPassword) {
      console.log("Passwords do not match.");
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
      console.log("Password is too short.");
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updateQuery = 'UPDATE users SET password_hash = ?, reset_otp = NULL, otp_expires = NULL WHERE id = ?'; // Clear OTP fields after successful reset

    // Corrected: Await db.query
    const [result] = await db.query(updateQuery, [hashedPassword, userId]);

    if (result.affectedRows === 0) {
      console.log("User not found.");
      return res.status(404).json({ message: "User not found." });
    }

    console.log("Password updated successfully.");
    return res.status(200).json({ message: "Password reset successful!" });
  } catch (err) {
    console.error("JWT verification or password reset failed:", err);
    return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
  }
});


app.get('/api/admin/establishments', async (req, res) => {
    // In a real application, the user_id would come from an authenticated session
    // (e.g., from a JWT token after login).
    // For now, we'll expect it as a query parameter for demonstration.
    const userId = req.query.user_id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required to fetch establishments.' });
    }

    try {
        const query = `
            SELECT
                e.id,
                e.estab_name AS name, -- Alias estab_name to 'name' to match frontend expectation
                COUNT(s.id) AS totalSensors -- Assuming a 'sensors' table or similar for total sensors
            FROM
                estab e
            JOIN
                admin_establishments ue ON e.id = ue.establishment_id
            LEFT JOIN
                sensors s ON e.id = s.establishment_id -- Join with a hypothetical 'sensors' table
            WHERE
                ue.user_id = ?
            GROUP BY
                e.id, e.estab_name
        `;
        const [rows] = await pool.query(query, [userId]);

        const establishments = rows.map(row => ({
            id: row.id,
            name: row.name, 
            totalSensors: row.totalSensors || 0, 
        }));

        res.json(establishments);
    } catch (error) {
        console.error('Error fetching establishments:', error);
        res.status(500).json({ message: 'Error fetching establishments from the database.' });
    }
});

/**
 * Returns a list of all existing establishment names.
 */
app.get('/api/establishments', async (req, res) => {
    try {
        // Correct SQL query to get establishments and their associated sensors via the junction table.
        const [rows] = await pool.execute(`
            SELECT
                e.id AS establishmentId,
                e.estab_name AS establishmentName,
                e.device_id AS deviceId, -- Still including establishment's own device_id
                s.id AS sensorId,
                s.sensor_name AS sensorName
            FROM
                estab e
            LEFT JOIN
                estab_sensors es ON e.id = es.estab_id -- Join through the junction table
            LEFT JOIN
                sensors s ON es.sensor_id = s.id -- Then join to the sensors table
            ORDER BY
                e.estab_name ASC, s.sensor_name ASC;
        `);

        const establishmentsMap = new Map();

        rows.forEach(row => {
            const { establishmentId, establishmentName, deviceId, sensorId, sensorName } = row;

            if (!establishmentsMap.has(establishmentId)) {
                establishmentsMap.set(establishmentId, {
                    id: establishmentId,
                    name: establishmentName,
                    device_id: deviceId, // Include establishment's device_id
                    sensors: []
                });
            }

            if (sensorId !== null) { // Check if a sensor exists for this link (for establishments with no sensors)
                establishmentsMap.get(establishmentId).sensors.push({
                    id: sensorId,
                    name: sensorName
                });
            }
        });

        const formattedEstablishments = Array.from(establishmentsMap.values());
        console.log('Fetched establishments with sensors:', JSON.stringify(formattedEstablishments, null, 2));
        res.status(200).json(formattedEstablishments);
    } catch (error) {
        console.error('Error fetching establishments:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * POST /api/establishments
 * Adds a new establishment and associates selected sensors with it.
 * Expects JSON body: {"name": "Establishment Name", "sensors": [sensor_id_1, sensor_id_2]}
 */
app.post('/api/establishments', async (req, res) => {
    const { name, sensors, device_id } = req.body; // 'device_id' here refers to the establishment's unique ID, not sensor assignment.

    // --- Input validation for the establishment name and establishment's device_id. ---
    if (!name || typeof name !== 'string' || name.trim() === '') {
        console.log("🔴 Backend - POST /api/establishments: Validation Error: Establishment name is required and must be a non-empty string.");
        return res.status(400).json({ error: 'Establishment name is required and must be a non-empty string.' });
    }
    // Validate device_id for the establishment itself (as generated by frontend or backend)
    if (!device_id || typeof device_id !== 'string' || !/^\d{5}$/.test(device_id)) {
        console.log("🔴 Backend - POST /api/establishments: Validation Error: Device ID is required and must be a 5-digit string.");
        return res.status(400).json({ error: 'Device ID is required and must be a 5-digit string.' });
    }

    // Ensure 'sensors' is an array; default to an empty array if not provided or invalid.
    const selectedSensorIds = Array.isArray(sensors) ? sensors : [];
    console.log(`🟢 Backend - POST /api/establishments: Received request for '${name}' with Establishment Device ID '${device_id}' and sensors: ${selectedSensorIds.join(', ')}`);

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        console.log("🔵 Backend - POST /api/establishments: Transaction started.");

        // 1. Check if an establishment with the same name already exists to prevent duplicates.
        const [existingName] = await connection.execute(
            'SELECT id FROM estab WHERE estab_name = ?',
            [name.trim()]
        );
        if (existingName.length > 0) {
            await connection.rollback();
            console.log(`🔴 Backend - POST /api/establishments: Conflict: Establishment '${name.trim()}' already exists.`);
            return res.status(409).json({ error: `Establishment '${name.trim()}' already exists.` });
        }

        // 2. Check if an establishment with the same device_id already exists.
        const [existingDeviceId] = await connection.execute(
            'SELECT id FROM estab WHERE device_id = ?',
            [device_id]
        );
        if (existingDeviceId.length > 0) {
            await connection.rollback();
            console.log(`🔴 Backend - POST /api/establishments: Conflict: Device ID '${device_id}' already exists.`);
            return res.status(409).json({ error: `Device ID '${device_id}' already exists. Please try adding the establishment again to generate a new ID.` });
        }

        // 3. Insert the new establishment into the 'estab' table.
        const [result] = await connection.execute(
            'INSERT INTO estab (estab_name, device_id) VALUES (?, ?)',
            [name.trim(), device_id]
        );
        const newEstablishmentId = result.insertId;
        console.log(`✅ Backend - POST /api/establishments: New establishment '${name.trim()}' added with ID: ${newEstablishmentId}, Device ID: ${device_id}`);

        // 4. Link selected sensors to the new establishment in the 'estab_sensors' junction table.
        // This is the core change for many-to-many.
        if (selectedSensorIds.length > 0) {
            // Optional: Validate if sensor IDs exist. If not, the FOREIGN KEY constraint will catch it.
            // For robustness, you might want to check if they exist before inserting.
            // Example:
            const sensorIdPlaceholders = selectedSensorIds.map(() => '?').join(',');
            const [existingSensors] = await connection.execute(
                `SELECT id FROM sensors WHERE id IN (${sensorIdPlaceholders})`,
                selectedSensorIds
            );
            const validSensorIds = existingSensors.map(s => s.id);

            if (validSensorIds.length !== selectedSensorIds.length) {
                const invalidSensors = selectedSensorIds.filter(id => !validSensorIds.includes(id));
                console.warn(`🟠 Backend - POST /api/establishments: Warning: Some provided sensor IDs (${invalidSensors.join(', ')}) do not exist in the 'sensors' table.`);
            }
            
            // Prepare values for batch insert into estab_sensors
            const insertValues = validSensorIds.map(sensorId => [newEstablishmentId, sensorId]);
            
            if (insertValues.length > 0) {
                // Use a multi-row insert for efficiency
                const insertSensorLinksSql = `INSERT INTO estab_sensors (estab_id, sensor_id) VALUES ?`;
                const [linkResult] = await connection.query(insertSensorLinksSql, [insertValues]); // Use .query for VALUES ? syntax
                console.log(`✅ Backend - POST /api/establishments: Linked ${linkResult.affectedRows} sensors to establishment ID: ${newEstablishmentId}.`);
            } else {
                console.log("🔵 Backend - POST /api/establishments: No valid sensors were selected or found to link.");
            }
        } else {
            console.log('🔵 Backend - POST /api/establishments: No sensors selected for this establishment.');
        }

        await connection.commit();
        console.log("🎉 Backend - POST /api/establishments: Establishment and sensors linked successfully. Transaction committed.");
        res.status(201).json({
            message: 'Establishment added successfully',
            id: newEstablishmentId,
            name: name.trim(),
            device_id: device_id
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
            console.error("🔴 Backend - POST /api/establishments: Transaction rolled back due to error:", error);
        }
        console.error('🔴 Backend - POST /api/establishments: Error adding establishment:', error);
        res.status(500).json({ error: 'Internal Server Error while adding establishment.' });
    } finally {
        if (connection) {
            connection.release();
            console.log("🔵 Backend - POST /api/establishments: Database connection released.");
        }
    }
});

/**
 * GET /api/sensors
 * Returns a list of all available sensors with their IDs and names.
 */
// In your backend, likely in app.js or a sensors-related route file
app.get('/api/devices/:deviceId/sensors', authenticateToken, async (req, res) => {
    const { deviceId } = req.params;
    // Get user details from the JWT payload attached by authenticateToken
    const userIdFromToken = req.user.id;
    const userRoleFromToken = req.user.role;
    const userDeviceIdFromToken = req.user.deviceId; // This is the deviceId from the JWT payload
    const userEstablishmentIdFromToken = req.user.establishmentId; // From JWT for admins

    if (!deviceId) {
        console.log('🔴 /api/devices/:deviceId/sensors: Device ID is missing in request parameters.');
        return res.status(400).json({ error: 'Device ID is required.' });
    }

    // Debugging logs to verify token contents at the start of the route
    console.log(`Backend Auth Debug: Requesting device ID: ${deviceId}`);
    console.log(`Backend Auth Debug: User ID from token: ${userIdFromToken}`);
    console.log(`Backend Auth Debug: User Role from token: ${userRoleFromToken}`);
    console.log(`Backend Auth Debug: User Device ID from token: ${userDeviceIdFromToken}`);
    console.log(`Backend Auth Debug: User Establishment ID from token: ${userEstablishmentIdFromToken}`);

    let connection;
    try {
        connection = await pool.getConnection(); // Assuming 'pool' is your database connection pool

        // --- Authorization Logic ---
        let authorized = false;

        if (userRoleFromToken === 'User') {
            // For a regular user, check if the requested deviceId matches the one assigned to them in their token
            if (userDeviceIdFromToken && userDeviceIdFromToken.toString() === deviceId.toString()) {
                authorized = true;
                console.log(`Backend Auth Debug: User ${userIdFromToken} authorized for device ${deviceId} via direct deviceId match.`);
            } else {
                console.warn(`Backend Auth Debug: User ${userIdFromToken} (role: User) attempting to access unauthorized device. Token deviceId: ${userDeviceIdFromToken}, Requested deviceId: ${deviceId}`);
            }
        } else if (userRoleFromToken === 'Admin') {
            // For an Admin, they can typically view devices associated with their assigned establishments.
            // Check if the requested device_id belongs to an establishment linked to this admin.
            // This requires checking the admin_establishments table.
            const [adminEstabs] = await connection.execute(
                `SELECT ae.establishment_id FROM admin_establishments ae WHERE ae.user_id = ?`,
                [userIdFromToken]
            );

            if (adminEstabs.length > 0) {
                const adminEstabIds = adminEstabs.map(row => row.establishment_id);
                // Now check if the requested deviceId exists in any of these establishments
                const [deviceInAdminEstabs] = await connection.execute(
                    `SELECT id FROM estab WHERE device_id = ? AND id IN (${adminEstabIds.map(() => '?').join(',')})`,
                    [deviceId, ...adminEstabIds]
                );
                if (deviceInAdminEstabs.length > 0) {
                    authorized = true;
                    console.log(`Backend Auth Debug: Admin ${userIdFromToken} authorized for device ${deviceId} via multi-establishment check.`);
                } else {
                    console.warn(`Backend Auth Debug: Admin ${userIdFromToken} (role: Admin) attempting to access unauthorized device ${deviceId}. Device not found in assigned establishments.`);
                }
            } else {
                console.warn(`Backend Auth Debug: Admin ${userIdFromToken} has no associated establishments for device check.`);
            }
        } else if (userRoleFromToken === 'Super Admin') {
            // Super Admin can access all devices (no specific check needed beyond valid token)
            authorized = true;
            console.log(`Backend Auth Debug: Super Admin ${userIdFromToken} authorized for device ${deviceId} (all access).`);
        }

        if (!authorized) {
            console.log(`🔴 Unauthorized access attempt: User ${userIdFromToken} (Role: ${userRoleFromToken}) tried to access device ${deviceId}.`);
            return res.status(403).json({ error: 'Access denied: Device does not belong to your account or is not found.' });
        }

        // If authorized, proceed to fetch sensors
        const [rows] = await connection.execute(
            `
            SELECT
                s.id AS id,
                s.sensor_name AS sensor_name
            FROM
                estab e
            JOIN
                estab_sensors es ON e.id = es.estab_id
            JOIN
                sensors s ON es.sensor_id = s.id
            WHERE
                e.device_id = ?
            ORDER BY
                s.sensor_name ASC;
            `,
            [deviceId]
        );

        console.log(`✅ Fetched sensors for device ${deviceId}:`, rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`🔴 Error fetching sensors for device ${deviceId}:`, error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } finally {
        if (connection) {
            connection.release();
            console.log("🔵 Database connection released for /api/devices/:deviceId/sensors.");
        }
    }
});

/**
 * DELETE /api/establishments/:id
 * Deletes an establishment by its ID.
 * Due to ON DELETE CASCADE, associated entries in `establishment_sensors` table will also be deleted.
 */
app.delete('/api/establishments/:id', async (req, res) => {
    const { id } = req.params; // Get the establishment ID from the URL parameter

    // Input validation: Ensure ID is a valid number
    const establishmentId = parseInt(id, 10);
    if (isNaN(establishmentId)) {
        return res.status(400).json({ error: 'Invalid establishment ID provided.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        // Start a transaction for the delete operation.
        await connection.beginTransaction();

        // Perform the deletion.
        // It's good practice to check if the establishment exists before attempting to delete,
        // although DELETE WHERE will simply affect 0 rows if it doesn't exist.
        const [result] = await connection.execute(
            'DELETE FROM estab WHERE id = ?',
            [establishmentId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback(); // Rollback if no rows were affected (establishment not found)
            return res.status(404).json({ message: 'Establishment not found.' });
        }

        // Commit the transaction if the deletion was successful
        await connection.commit();
        console.log(`Establishment with ID ${establishmentId} deleted successfully.`);
        res.status(200).json({ message: 'Establishment deleted successfully.' });

    } catch (error) {
        // Rollback transaction on error
        if (connection) {
            await connection.rollback();
        }
        console.error('Error deleting establishment:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    } finally {
        // Release the connection back to the pool
        if (connection) {
            connection.release();
        }
    }
});

/**
 * GET /api/admin/establishments-for-creation
 * This endpoint fetches all establishments with a specific format suitable for the AdminCreationForm.
 * It queries the `establishments` table and returns a list of establishments with 'id' and 'name' (aliased as estab_name).
 * Removed the userId requirement as it's not needed for listing all establishments for new admin assignment.
 */
app.get('/api/admin/establishments-for-creation', async (req, res) => { // Updated endpoint name
    try {
        // Query the 'establishments' table to get all establishments.
        // Alias 'name' column to 'estab_name' to match frontend's expectation in AdminCreationForm.
        const [rows] = await pool.execute('SELECT id, estab_name AS estab_name FROM estab ORDER BY estab_name ASC');
        console.log('Fetched admin establishments for creation:', rows); // Updated log message
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching admin establishments for creation:', error); // Updated log message
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// --- NEW API Endpoint: Get Establishments assigned to a specific User (Admin) ---
// This endpoint requires authentication to ensure only authorized users access their data.
// Assuming 'app' is your Express app instance and 'pool' is your MySQL connection pool
// and 'authenticateAdminRoute' is your middleware.

app.get('/api/admin/assigned-establishments', authenticateAdminRoute, async (req, res) => {
    const userId = req.userId; // Get user ID from JWT (set by authenticateAdminRoute middleware)

    try {
        // SQL query to get establishments assigned to the user, and all their associated sensors
        // The crucial change is adding WHERE ae.admin_id = ?
        const [rows] = await pool.execute(`
            SELECT
                e.id AS establishmentId,
                e.estab_name AS establishmentName,
                e.device_id AS deviceId,
                s.id AS sensorId,
                s.sensor_name AS sensorName
            FROM
                estab e
            JOIN
                admin_establishments ae ON e.id = ae.establishment_id
            LEFT JOIN
                estab_sensors es ON e.id = es.estab_id
            LEFT JOIN
                sensors s ON es.sensor_id = s.id
            WHERE
                ae.user_id = ?  -- <--- THIS IS THE KEY CHANGE
        `, [userId]); // Pass userId as a parameter for the WHERE clause

        // Process the flat rows from the SQL query into a hierarchical structure
        const establishmentsMap = new Map();

        rows.forEach(row => {
            const { establishmentId, establishmentName, deviceId, sensorId, sensorName } = row;

            if (!establishmentsMap.has(establishmentId)) {
                establishmentsMap.set(establishmentId, {
                    id: establishmentId,
                    name: establishmentName,
                    device_id: deviceId,
                    sensors: [] // Initialize an empty array for this establishment's sensors
                });
            }

            // Only add sensor if it exists (left join might return null for sensorId/sensorName)
            if (sensorId !== null) {
                establishmentsMap.get(establishmentId).sensors.push({
                    id: sensorId,
                    name: sensorName
                });
            }
        });

        const formattedEstablishments = Array.from(establishmentsMap.values());
        console.log(`Fetched assigned establishments with sensors for user ${userId}:`, JSON.stringify(formattedEstablishments, null, 2));
        res.status(200).json(formattedEstablishments);
    } catch (error) {
        console.error(`Error fetching assigned establishments for user ${userId}:`, error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// API endpoint to get total users
app.get('/api/total-users', async (req, res) => { // Added 'async'
  const querySql = 'SELECT COUNT(*) AS totalUsers FROM users'; // Assuming your user table is named 'users'

  console.log('Attempting to fetch total users from the database...');

  try {
    // Corrected: Use db.query directly (assuming 'db' is your mysql2/promise pool)
    const [results] = await db.query(querySql);

    // Check if results are valid and contain the expected data
    if (results && results.length > 0 && results[0].hasOwnProperty('totalUsers')) {
      const totalUsers = results[0].totalUsers;
      console.log(`Successfully fetched total users: ${totalUsers}`);
      res.json({ totalUsers: totalUsers });
    } else {
      // This case handles unexpected query results (e.g., empty results, or missing 'totalUsers' column)
      console.warn('Query for total users returned an unexpected or empty result set:', results);
      return res.status(500).json({
        error: 'Failed to retrieve total users count; unexpected database response format.',
        details: 'The database query returned an invalid or empty result for total users.'
      });
    }
  } catch (error) { // Changed 'err' to 'error' for consistency and clarity
    console.error('Database query error when fetching total users:', error.message);

    // Log more specific details from the MySQL error object
    if (error.code) {
      console.error(`MySQL Error Code: ${error.code}`);
    }
    if (error.sqlMessage) {
      console.error(`MySQL Error Message: ${error.sqlMessage}`);
    }
    if (error.sql) {
      console.error(`Faulty SQL Query: ${error.sql}`);
    }

    // Send a 500 Internal Server Error response to the client
    return res.status(500).json({
      error: 'Failed to fetch total users due to a server-side database error.',
      details: error.message // Include error message for debugging purposes (consider removing in production)
    });
  }
});

// Fetch total number of Super Admin accounts
app.get('/api/total-super-admins', async (req, res) => {
  const querySql = "SELECT COUNT(*) AS totalSuperAdmins FROM users WHERE role = 'Super Admin'";

  console.log('Attempting to fetch total Super Admin accounts from the database...');

  try {
    const [results] = await db.query(querySql);

    if (results && results.length > 0 && results[0].hasOwnProperty('totalSuperAdmins')) {
      const totalSuperAdmins = results[0].totalSuperAdmins;
      console.log(`Successfully fetched total Super Admin accounts: ${totalSuperAdmins}`);
      res.json({ totalSuperAdmins: totalSuperAdmins });
    } else {
      console.warn('Query for total Super Admin accounts returned an unexpected or empty result set:', results);
      return res.status(500).json({
        error: 'Failed to retrieve total Super Admin accounts count; unexpected database response format.',
        details: 'The database query returned an invalid or empty result for total Super Admin accounts.'
      });
    }
  } catch (error) {
    console.error('Database query error when fetching total Super Admin accounts:', error.message);

    if (error.code) {
      console.error(`MySQL Error Code: ${error.code}`);
    }
    if (error.sqlMessage) {
      console.error(`MySQL Error Message: ${error.sqlMessage}`);
    }
    if (error.sql) {
      console.error(`Faulty SQL Query: ${error.sql}`);
    }

    return res.status(500).json({
      error: 'Failed to fetch total Super Admin accounts due to a server-side database error.',
      details: error.message
    });
  }
});

// fetch estab 
app.get('/api/total-establishments', async (req, res) => { // Added 'async'
  const querySql = 'SELECT COUNT(*) AS totalEstablishments FROM estab'; // Changed 'query' to 'querySql' for clarity

  try {
    const [results] = await db.query(querySql); // Use await db.query and destructure

    const total = results[0].totalEstablishments;
    res.json({ totalEstablishments: total });
  } catch (err) {
    console.error('Error fetching total establishments:', err);
    return res.status(500).json({ error: 'Failed to fetch total establishments' });
  }
});

// ✅ Direct endpoint for fetching total sensors
app.get('/api/total-sensors', async (req, res) => { // Added 'async'
  const querySql = 'SELECT COUNT(*) AS totalSensors FROM sensors'; // Changed 'query' to 'querySql' for clarity

  try {
    const [results] = await db.query(querySql); // Use await db.query and destructure

    const total = results[0].totalSensors;
    res.json({ totalSensors: total });
  } catch (err) {
    console.error('Error fetching total sensors:', err);
    return res.status(500).json({ error: 'Failed to fetch total sensors' });
  }
});

// fetch for the modal
app.get('/api/total-sensors', (req, res) => {
  const query = 'SELECT COUNT(*) AS totalSensors FROM sensors'; // Replace 'sensors' with your actual table name

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching total sensors:', err);
      return res.status(500).json({ error: 'Failed to fetch total sensors' });
    }

    const total = results[0].totalSensors;
    res.json({ totalSensors: total });
  });
});

// --- NEW API ENDPOINT FOR APPROVING USER ACCESS ---
app.put("/api/admin/access-requests/:notificationId/approve", verifyToken, authorizeAdmin, async (req, res) => {
    // Extract notificationId from URL parameters
    const { notificationId } = req.params;
    // Extract userId from the request body (as sent by the frontend)
    const { userId } = req.body;

    console.log("🟢 /api/admin/access-requests/:notificationId/approve: Received request to approve user access.");
    console.log("🟢 /api/admin/access-requests/:notificationId/approve: Params:", { notificationId });
    console.log("🟢 /api/admin/access-requests/:notificationId/approve: Request Body:", { userId });

    if (!userId || !notificationId) {
        console.log("🔴 /api/admin/access-requests/:notificationId/approve: Missing User ID or Notification ID in request.");
        return res.status(400).json({ success: false, message: "User ID and Notification ID are required for approval." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        console.log("🔵 /api/admin/access-requests/:notificationId/approve: Transaction started.");

        // 1. Update the user's is_verified status in the database
        const updateUserSql = "UPDATE users SET is_verified = 1 WHERE id = ?";
        console.log("🔵 /api/admin/access-requests/:notificationId/approve: Executing SQL to update user verification:", updateUserSql, "with userId:", userId);
        const [updateUserResult] = await connection.query(updateUserSql, [userId]);

        console.log("🔵 /api/admin/access-requests/:notificationId/approve: User update SQL result:", updateUserResult);
        if (updateUserResult.affectedRows === 0) {
            console.log("🟠 /api/admin/access-requests/:notificationId/approve: User not found or already verified. Affected rows: 0.");
            await connection.rollback();
            console.error("🔴 /api/admin/access-requests/:notificationId/approve: Transaction rolled back as no user was found/updated.");
            return res.status(404).json({ success: false, message: "User not found or already verified." });
        }
        console.log(`✅ /api/admin/access-requests/:notificationId/approve: User ${userId} is_verified updated. Affected rows: ${updateUserResult.affectedRows}`);

        // 2. Update the notification status in the 'notif' table
        const updateNotificationSql = "UPDATE notif SET status = ?, is_read = 1 WHERE id = ? AND type = 'request'";
        console.log("🔵 /api/admin/access-requests/:notificationId/approve: Executing SQL to update notification status:", updateNotificationSql, "with notificationId:", notificationId);
        const [updateNotifResult] = await connection.query(updateNotificationSql, ['approved', notificationId]);

        console.log("🔵 /api/admin/access-requests/:notificationId/approve: Notification update SQL result:", updateNotifResult);
        if (updateNotifResult.affectedRows === 0) {
            console.log("🟠 /api/admin/access-requests/:notificationId/approve: Notification not found or not a pending request. Affected rows: 0.");
            // This might happen if the notification was already processed or deleted.
            // We can still commit the user update if the user update was successful,
            // but it's safer to rollback if the primary record of the request isn't found/updated.
            await connection.rollback();
            console.error("🔴 /api/admin/access-requests/:notificationId/approve: Transaction rolled back as notification was not found/updated.");
            return res.status(404).json({ success: false, message: "Access request notification not found or already processed." });
        }
        console.log(`✅ /api/admin/access-requests/:notificationId/approve: Notification ${notificationId} status updated to 'approved'.`);


        // Commit the transaction
        await connection.commit();
        console.log(`🎉 /api/admin/access-requests/:notificationId/approve: User ${userId} successfully verified and request ${notificationId} processed. Transaction committed.`);
        res.status(200).json({ success: true, message: "User access approved successfully." });

    } catch (err) {
        if (connection) {
            await connection.rollback(); // Rollback on any error
            console.error("🔴 /api/admin/access-requests/:notificationId/approve: Transaction rolled back due to error:", err);
        }
        console.error("🔴 /api/admin/access-requests/:notificationId/approve: Error during user approval process:", err);
        res.status(500).json({ success: false, message: "Failed to verify user and process request due to a server error." });
    } finally {
        if (connection) {
            connection.release();
            console.log("🔵 /api/admin/access-requests/:notificationId/approve: Database connection released.");
        }
    }
});

// Save user to the database google login
app.post('/save-user', async (req, res) => {
  const { email, name } = req.body;

  try {
    let userId;

    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log('User with email', email, 'already exists. Logging in.');
    } else {
      const insertQuery = `INSERT INTO users (email, username) VALUES (?, ?)`;
      const [result] = await db.query(insertQuery, [email, name]);
      userId = result.insertId;
      console.log('New user created with email:', email);
    }

    // Generate JWT Token
    // *** CHANGE JWT_SECRET TO secretKey HERE! ***
    const token = jwt.sign(
      { userId: userId, email: email, username: name }, // Payload
      secretKey, // <--- THIS IS THE CHANGE: Use 'secretKey' here
      { expiresIn: '1h' } // Token expiration
    );

    res.status(200).json({
      message: 'User processed and logged in successfully',
      token: token, // Send the token back!
      userId: userId,
      email: email,
      username: name // Include username in response
    });

  } catch (err) {
    console.error('Error in /save-user:', err);
    // You might want to add a more specific message if the error is due to the secret
    // e.g., if (err.name === 'JsonWebTokenError') { ... }
    res.status(500).json({ error: 'Server error during social login process.' });
  }
});

app.get('/api/events', async (req, res) => {
  const { date } = req.query;
  try {
    if (date) {
      const [rows] = await pool.execute('SELECT * FROM events WHERE event_date = ? ORDER BY time, id', [date]);
      res.json(rows);
    } else {
      const [rows] = await pool.execute('SELECT * FROM events ORDER BY event_date, time');
      res.json(rows);
    }
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to fetch events for a specific date (if needed for specific date view)

// Example: GET /api/events?date=2024-03-15
app.get('/api/events', async (req, res) => {
  const { date } = req.query; // date should be in 'YYYY-MM-DD' format

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required.' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM events WHERE event_date = ? ORDER BY time, id', [date]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching events for date:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/events', async (req, res) => {
  const { title, time, description, event_date } = req.body;

  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event_date are required.' });
  }

  try {
    // Using parameterized queries (?) for security against SQL injection
    const [result] = await pool.execute(
      'INSERT INTO events (title, time, description, event_date) VALUES (?, ?, ?, ?)',
      [title, time || null, description || null, event_date]
    );

    // After insertion, fetch the newly created event to return it (including its ID)
    const [newEventRows] = await pool.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(newEventRows[0]); // Return the newly created event
  } catch (err) {
    console.error('Error adding event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an event
// Example: DELETE /api/events/123
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.status(200).json({ message: `Event with ID ${id} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Notification Endpoints ---

// 1. POST endpoint to receive new Super Admin notifications (from SignupForm)
app.post('/api/notifications/superadmin', async (req, res) => {
    // Destructure all expected fields.
    // Ensure all variables that correspond to placeholders are defined.
    // Default optional fields to null if they might be missing from the request body.
    const {
        type,
        title,
        message,
        user_id = null, // user_id can be null if not associated with a specific user, or if the user's ID isn't immediately available. It's often present for 'new_user' type.
        related_id = null, // related_id should be null for a new user signup notification
        priority = 'normal', // Default priority if not provided by frontend
        status = 'active'    // Default status for a new user signup notification
    } = req.body;

    if (!type || !title || !message) {
        return res.status(400).json({ success: false, message: 'Missing required notification fields.' });
    }

    const validTypes = ['sensor', 'request', 'new_user', 'schedule']; // From your notifications table ENUM
    if (!validTypes.includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid notification type provided.' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            // Updated INSERT statement and values array
            // Make sure the number of '?' matches the number of elements in the array
            const [result] = await connection.execute(
                `INSERT INTO notif (type, title, message, user_id, related_id, timestamp, is_read, priority, status)
                 VALUES (?, ?, ?, ?, ?, NOW(), FALSE, ?, ?)`, // 7 placeholders
                [type, title, message, user_id, related_id, priority, status] // 7 values in this order
            );
            res.status(201).json({ success: true, message: 'Notification added successfully.', notificationId: result.insertId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding new user notification:', error);
        // More descriptive error message for debugging
        res.status(500).json({ success: false, message: 'Server error while adding notification. Please check server logs for details.' });
    }
});

// notif
app.post('/api/access-requests', async (req, res) => {
    // Destructure deviceId from the request body
    const { fromUser, fromUserId, deviceId } = req.body; // Expecting these from the frontend

    console.log("🟢 /api/access-requests: Received request to send access request.");
    console.log("🟢 /api/access-requests: Request Body:", { fromUser, fromUserId, deviceId });

    // Add validation for deviceId
    if (!fromUser || !fromUserId || !deviceId) {
        console.log("🔴 /api/access-requests: Missing User ID, Username, or Device ID in request.");
        return res.status(400).json({ success: false, message: 'Missing user information or device ID.' });
    }

    let connection;
    try {
        connection = await pool.getConnection(); // Get a connection from the pool
        await connection.beginTransaction(); // Start a transaction

        console.log("🔵 /api/access-requests: Transaction started.");

        // --- NEW STEP: 1. Update the user's device_id in the 'users' table ---
        const updateUserDeviceIdSql = "UPDATE users SET device_id = ? WHERE id = ?";
        console.log("🔵 /api/access-requests: Executing SQL to update user's device_id:", updateUserDeviceIdSql, "with deviceId:", deviceId, "and userId:", fromUserId);
        const [updateUserResult] = await connection.execute(updateUserDeviceIdSql, [deviceId, fromUserId]);

        console.log("🔵 /api/access-requests: User device_id update SQL result:", updateUserResult);
        if (updateUserResult.affectedRows === 0) {
            console.log("🟠 /api/access-requests: User not found when trying to update device_id. Affected rows: 0.");
            await connection.rollback();
            console.error("🔴 /api/access-requests: Transaction rolled back as user device_id could not be updated.");
            return res.status(404).json({ success: false, message: "Failed to assign device ID. User not found." });
        }
        console.log(`✅ /api/access-requests: User ${fromUserId}'s device_id updated to ${deviceId}. Affected rows: ${updateUserResult.affectedRows}`);

        // 2. Check if a pending request already exists for this user and device ID
        // This prevents duplicate requests for the same user-device combination.
        const [existingRequests] = await connection.execute(
            'SELECT id FROM notif WHERE user_id = ? AND type = ? AND status = ? AND device_id = ?',
            [fromUserId, 'request', 'pending', deviceId] // Include deviceId in the check
        );

        if (existingRequests.length > 0) {
            console.log("🟠 /api/access-requests: Existing pending request found for user and device. Rolling back.");
            await connection.rollback(); // Rollback the device_id update too if notification already exists
            return res.status(409).json({ success: false, message: 'You already have a pending access request for this device. Please wait for the Super Admin\'s review.' });
        }
        console.log("✅ /api/access-requests: No existing pending request found.");


        // 3. Insert the new access request into the 'notif' table
        const title = 'Access Request';
        const message = `User '${fromUser}' (ID: ${fromUserId}) has requested access to restricted features for Device ID: ${deviceId}.`;
        const status = 'pending';
        const priority = 'normal';

        const [result] = await connection.execute(
            'INSERT INTO notif (type, title, message, user_id, related_id, priority, status, device_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['request', title, message, fromUserId, null, priority, status, deviceId] // Pass deviceId here
        );

        if (result.affectedRows === 1) {
            await connection.commit(); // Commit both operations if successful
            console.log(`🎉 /api/access-requests: Access request sent for user ${fromUserId} and device ${deviceId}. Device ID updated in users table. Transaction committed.`);
            res.status(201).json({ success: true, message: 'Your access request has been sent to the Super Admin for review.', requestId: result.insertId });
        } else {
            console.log("🔴 /api/access-requests: Failed to insert notification. Rolling back.");
            await connection.rollback(); // Rollback if notification insertion fails
            res.status(500).json({ success: false, message: 'Failed to send access request.' });
        }

    } catch (error) {
        if (connection) {
            await connection.rollback(); // Rollback on any error during the process
            console.error("🔴 /api/access-requests: Transaction rolled back due to error:", error);
        }
        console.error('🔴 Error in /api/access-requests:', error);
        res.status(500).json({ success: false, message: 'Server error while processing your request.' });
    } finally {
        if (connection) {
            connection.release(); // Release the connection back to the pool
            console.log("🔵 /api/access-requests: Database connection released.");
        }
    }
});

app.get('/api/admin/notifications', authenticateAdminRoute, async (req, res) => {
    const { type: filterType } = req.query; // Get the optional 'type' query parameter

    try {
        const connection = await pool.getConnection();
        try {
            let combinedNotifications = [];

            if (filterType === 'schedule') {
                // Fetch ONLY scheduled events if filterType is 'schedule'
                const [eventsRows] = await connection.execute(
                    `SELECT
                        id,
                        title,
                        time,
                        description,
                        event_date,
                        created_at
                    FROM events
                    ORDER BY event_date DESC, time DESC`
                );

                // Map events to a notification-like structure
                const mappedEventsAsNotifications = eventsRows.map(event => ({
                    id: `event_${event.id}`, // Prefix ID to avoid conflicts
                    type: 'schedule',
                    title: `Scheduled Event: ${event.title}`,
                    message: `Date: ${new Date(event.event_date).toLocaleDateString()} ${event.time ? `at ${event.time}` : ''}. Details: ${event.description || 'No description.'}`,
                    createdAt: event.created_at,
                    read: false, // Events are not 'read' in the same way, can be set to true if viewed
                    fromUserId: null,
                    related_id: event.id,
                    priority: 'normal',
                    status: 'active'
                }));
                combinedNotifications = mappedEventsAsNotifications;

            } else {
                // Fetch actual notifications (all types)
                const [notificationsRows] = await connection.execute(
                    `SELECT
                        id,
                        type,
                        title,
                        message,
                        timestamp AS createdAt,
                        is_read AS \`read\`,
                        user_id ,
                        related_id,
                        priority,
                        status
                    FROM notif
                    ORDER BY timestamp DESC`
                );

                // Fetch scheduled events
                const [eventsRows] = await connection.execute(
                    `SELECT
                        id,
                        title,
                        time,
                        description,
                        event_date,
                        created_at
                    FROM events
                    ORDER BY event_date DESC, time DESC`
                );

                // Map events to a notification-like structure
                const mappedEventsAsNotifications = eventsRows.map(event => ({
                    id: `event_${event.id}`,
                    type: 'schedule',
                    title: `Scheduled Event: ${event.title}`,
                    message: `Date: ${new Date(event.event_date).toLocaleDateString()} ${event.time ? `at ${event.time}` : ''}. Details: ${event.description || 'No description.'}`,
                    createdAt: event.created_at,
                    read: false,
                    fromUserId: null,
                    related_id: event.id,
                    priority: 'normal',
                    status: 'active'
                }));

                // Combine all fetched data and sort
                combinedNotifications = [...notificationsRows, ...mappedEventsAsNotifications].sort((a, b) => {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
                });
            }

            res.status(200).json({ success: true, notifications: combinedNotifications });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error fetching admin notifications and events:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching notifications and events.' });
    }
});


/**
 * API Endpoint: DELETE /api/admin/events/:id
 * Deletes a single event from the 'events' table.
 * Requires authentication via Bearer token.
 */
app.delete('/api/admin/events/:id', authenticateAdminRoute, async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM events WHERE id = ?`,
                [id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Event not found.' });
            }
            res.status(200).json({ success: true, message: 'Event deleted successfully.' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting event.' });
    }
});

/**
 * API Endpoint: POST /api/admin/events/delete-multiple
 * Deletes multiple events from the 'events' table based on an array of IDs.
 * This is useful for 'Delete All' functionality on the frontend.
 * Requires authentication via Bearer token.
 */
app.post('/api/admin/events/delete-multiple', authenticateAdminRoute, async (req, res) => {
    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No event IDs provided for deletion.' });
    }

    // Convert IDs to numbers to ensure they are valid for SQL IN clause
    const numericEventIds = eventIds.map(Number).filter(id => !isNaN(id));

    if (numericEventIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid event IDs provided for deletion.' });
    }

    // Create a string of placeholders for the IN clause (e.g., '?, ?, ?')
    const placeholders = numericEventIds.map(() => '?').join(',');

    try {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM events WHERE id IN (${placeholders})`,
                numericEventIds // Pass the array of IDs directly
            );

            res.status(200).json({ success: true, message: `${result.affectedRows} events deleted successfully.` });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting multiple events:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting multiple events.' });
    }
});


app.get('/api/user/notifications', authenticateUser, async (req, res) => {
    const userId = req.user.id; // Get the authenticated user's ID from the token

    if (!userId) {
        return res.status(401).json({ success: false, message: 'User ID not found in token.' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            // 1. Fetch notifications for the specific user_id
            const [userNotificationsRows] = await connection.execute(
                `SELECT
                    id,
                    type,
                    title,
                    message,
                    timestamp AS createdAt,
                    is_read AS \`read\`,
                    user_id AS fromUserId,
                    related_id,
                    priority,
                    status
                FROM notif
                WHERE user_id = ?
                ORDER BY timestamp DESC`,
                [userId]
            );

            // 2. Fetch all scheduled events (since they are not user-specific)
            const [eventsRows] = await connection.execute(
                `SELECT
                    id,
                    title,
                    time,
                    description,
                    event_date,
                    created_at
                FROM events
                ORDER BY event_date DESC, time DESC` // Order by date, then time
            );

            // 3. Map events to a notification-like structure
            const mappedEventsAsNotifications = eventsRows.map(event => ({
                id: `event_${event.id}`, // Prefix ID to avoid conflicts with actual notification IDs
                type: 'schedule', // This will map to 'schedule' in your ENUM
                title: `Scheduled Event: ${event.title}`,
                message: `Date: ${new Date(event.event_date).toLocaleDateString()} ${event.time ? `at ${event.time}` : ''}. Details: ${event.description || 'No description.'}`,
                createdAt: event.created_at, // Use event's created_at for timestamp
                read: false, // Events are not 'read' in the same way, can be set to true if viewed
                fromUserId: null, // No specific user associated unless you add 'user_id' to events table
                related_id: event.id, // Link back to the original event ID
                priority: 'normal', // Default priority for events
                status: 'active' // You might want a status for events, e.g., 'active', 'completed', 'cancelled'
            }));

            // 4. Combine all fetched data and sort by timestamp
            const combinedNotifications = [...userNotificationsRows, ...mappedEventsAsNotifications].sort((a, b) => {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first
            });

            res.status(200).json({ success: true, notifications: combinedNotifications });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(`Error fetching notifications and events for user ${userId}:`, error);
        res.status(500).json({ success: false, message: 'Server error while fetching user notifications and events.' });
    }
});

/**
 * API Endpoint: POST /api/user/notifications/mark-read
 * Marks one or more user notifications as read in the database.
 * Requires authentication via Bearer token.
 */


app.delete('/api/admin/notifications/:id', authMiddleware, authorizeRoles(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const notificationId = req.params.id; // Get the notification ID from the URL parameters

        console.log(`Admin user (ID: ${req.user.id}, Role: ${req.user.role}) is attempting to delete notification ID: ${notificationId}`);

        // --- THE FIX IS HERE: Use MySQL query to delete ---
        // Assuming your notifications table is named 'notifications' and the ID column is 'id' or 'notification_id'
        const query = 'DELETE FROM notif WHERE id = ?'; // Use '?' as placeholder for parameter
        // If your ID column is named something else, e.g., 'notification_id', change 'id' above.

        pool.query(query, [notificationId], (error, results) => {
            if (error) {
                console.error('MySQL Error: Failed to delete individual notification:', error);
                return res.status(500).json({
                    success: false,
                    message: 'An error occurred while trying to delete the notification from the database.',
                    error: error.message,
                });
            }

            // Check if any rows were affected (i.e., if a notification was found and deleted)
            if (results.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found.'
                });
            }

            res.status(200).json({
                success: true,
                message: `Notification with ID ${notificationId} deleted successfully.`,
            });
        });

    } catch (error) {
        // This catch block handles errors *before* the pool.query callback, e.g., if req.params.id is missing.
        console.error('Server Error (outer catch): Failed to delete individual notification:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred on the server.',
            error: error.message,
        });
    }
});

// --- NEW ROUTE FOR DELETING ALL NOTIFICATIONS ---
// This route requires authentication and specifically allows only 'admin' or 'super-admin' roles
app.delete('/api/admin/notifications/all', authMiddleware, authorizeRoles(['Admin', 'Super Admin']), async (req, res) => {
    try {
        console.log(`Admin user (ID: ${req.user.id}, Role: ${req.user.role}) is attempting to delete all notifications.`);

        const result = await Notification.deleteMany({}); // Delete all documents

        res.status(200).json({
            success: true,
            message: `Successfully deleted all (${result.deletedCount}) notifications.`,
        });
    } catch (error) {
        console.error('Server Error: Failed to delete all notifications:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while trying to delete all notifications. Please try again later.',
            error: error.message,
        });
    }
});


app.post('/api/admin/notifications/mark-all-read', authMiddleware, authorizeRoles(['Admin', 'Super Admin']), async (req, res) => {
    try {
        // Log who is attempting to mark all notifications as read (for auditing)
        console.log(`Admin user (ID: ${req.user.id}, Role: ${req.user.role}) is attempting to mark ALL notifications as read.`);

        // --- THE FIX IS HERE: Use MySQL query to update all unread records ---
        // We'll mark all notifications as read where 'read' is currently false (or 0)
        // If your 'read' column stores boolean as TINYINT(1), use 0 for false and 1 for true.
        const query = 'UPDATE notif SET is_read = ? WHERE is_read = ?'; // Update 'read' to 1 where it's 0

        pool.query(query, [1, 0], (error, results) => {
            if (error) {
                console.error('MySQL Error: Failed to mark all notifications as read:', error);
                return res.status(500).json({
                    success: false,
                    message: 'An error occurred while trying to mark all notifications as read in the database.',
                    error: error.message,
                });
            }

            // results.affectedRows will indicate how many rows were updated
            res.status(200).json({
                success: true,
                message: `Successfully marked all (${results.affectedRows}) unread notifications as read.`,
            });
        });

    } catch (error) {
        // This outer catch block handles errors that occur *before* the pool.query callback,
        // such as issues with authentication or authorization middleware.
        console.error('Server Error (outer catch): Failed to mark all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred on the server while attempting to mark all notifications as read.',
            error: error.message,
        });
    }
});

app.post('/api/admin/notifications/mark-read', authMiddleware, authorizeRoles(['Admin', 'Super Admin']), async (req, res) => {
    try {
        const { notificationId } = req.body; // Expecting the ID in the request body

        if (!notificationId) {
            return res.status(400).json({ success: false, message: 'Notification ID is required.' });
        }

        console.log(`Admin user (ID: ${req.user.id}, Role: ${req.user.role}) is attempting to mark notification ID: ${notificationId} as read.`);

        // --- THE FIX IS HERE: Use MySQL query to update a specific record ---
        // Update the 'read' column to true (1) for the specific notification ID
        // Assuming your 'read' column is TINYINT(1) and your ID column is 'id'
        const query = 'UPDATE notif SET is_read = ? WHERE id = ?';

        // Use 1 for 'true' and the notificationId for the WHERE clause
        pool.query(query, [1, notificationId], (error, results) => {
            if (error) {
                console.error('MySQL Error: Failed to mark notification as read:', error);
                return res.status(500).json({
                    success: false,
                    message: 'An error occurred while trying to mark the notification as read in the database.',
                    error: error.message,
                });
            }

            // Check if any rows were affected (i.e., if a notification was found and updated)
            if (results.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found or already marked as read.'
                });
            }

            res.status(200).json({
                success: true,
                message: `Notification with ID ${notificationId} marked as read successfully.`,
            });
        });

    } catch (error) {
        // This outer catch block handles errors that occur *before* the pool.query callback,
        // such as issues with authentication or authorization middleware, or req.body parsing.
        console.error('Server Error (outer catch): Failed to mark individual notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred on the server.',
            error: error.message,
        });
    }
});

app.post('/api/user/notifications/mark-read', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const { notificationIds } = req.body; // Can be a single ID or an array of IDs

    if (!notificationIds || (Array.isArray(notificationIds) && notificationIds.length === 0)) {
        return res.status(400).json({ success: false, message: 'No notification IDs provided.' });
    }

    // Ensure notificationIds is an array
    const idsToMark = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    try {
        const connection = await pool.getConnection();
        try {
            // Use IN clause for multiple updates
            const placeholders = idsToMark.map(() => '?').join(',');
            const [result] = await connection.execute(
                `UPDATE notif SET is_read = TRUE WHERE id IN (${placeholders}) AND user_id = ?`,
                [...idsToMark, userId] // Add userId to ensure only their notifications are marked
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'No matching notifications found for this user.' });
            }
            res.status(200).json({ success: true, message: `${result.affectedRows} notifications marked as read.` });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking user notifications as read:', error);
        res.status(500).json({ success: false, message: 'Server error while marking notifications as read.' });
    }
});
/**
 * API Endpoint: DELETE /api/user/notifications/:id
 * Deletes a single user notification from the database.
 * Requires authentication via Bearer token.
 */
app.delete('/api/user/notifications/:id', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM notif WHERE id = ? AND user_id = ?`,
                [notificationId, userId] // Ensure only their notification is deleted
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Notification not found or does not belong to this user.' });
            }
            res.status(200).json({ success: true, message: 'Notification deleted successfully.' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting user notification:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting user notification.' });
    }
});


/**
 * API Endpoint: POST /api/user/notifications/delete-all
 * Deletes all notifications for the authenticated user from the database.
 * Requires authentication via Bearer token.
 */
app.post('/api/user/notifications/delete-all', authenticateUser, async (req, res) => {
    const userId = req.user.id;

    try {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.execute(
                `DELETE FROM notif WHERE user_id = ?`,
                [userId]
            );
            res.status(200).json({ success: true, message: `${result.affectedRows} notifications deleted.` });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting all user notifications:', error);
        res.status(500).json({ success: false, message: 'Server error while deleting all user notifications.' });
    }
});

// API endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const [rows] = await pool.execute(
            'INSERT INTO landing_table (your_name, your_email, your_message) VALUES (?, ?, ?)',
            [name, email, message]
        );
        res.status(201).json({ message: 'Message sent successfully!', insertedId: rows.insertId });
    } catch (error) {
        console.error('Error inserting message into database:', error);
        res.status(500).json({ message: 'Server error. Could not send message.' });
    }
});


// --- 1. Endpoint to get AVAILABLE sensors for adding to an establishment ---
// This addresses the 404 error from Dashboard.js's fetchAvailableSensors()
app.get('/api/sensors', verifyToken, async (req, res) => { // Renamed endpoint
    let connection;
    try {
        connection = await db.getConnection();
        // Now it simply fetches all sensors, as 'device_id' is no longer for assignment
        // If 'device_id' was your sensor's actual unique hardware ID, you could keep it.
        // Assuming it was for assignment, we remove it from the select.
        const [sensors] = await connection.execute(
            `SELECT id, sensor_name FROM sensors ORDER BY sensor_name ASC`
        );
        console.log('🟢 Backend - /api/sensors: Fetched all sensors:', sensors);
        res.status(200).json(sensors);
    } catch (error) {
        console.error('🔴 Backend - /api/sensors: Error fetching all sensors:', error);
        res.status(500).json({ message: 'Internal Server Error fetching all sensors.' });
    } finally {
        if (connection) connection.release();
    }
});

// --- Endpoint to reset a device_id for a sensor (set it to NULL) ---
// This can be used if you want to 'unassign' a sensor from a device.
// You could call this from an admin panel if you have a "Remove Sensor from Device" button.
app.put('/api/sensors/:sensorId/unassign-device', verifyToken, authorizeAdmin, async (req, res) => {
    const { sensorId } = req.params;
    console.log(`🟢 /api/sensors/${sensorId}/unassign-device: Request to unassign device from sensor.`);

    if (!sensorId) {
        return res.status(400).json({ success: false, message: 'Sensor ID is required.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.execute(
            `UPDATE sensors SET device_id = NULL WHERE id = ?`,
            [sensorId]
        );

        if (result.affectedRows > 0) {
            console.log(`✅ Sensor ${sensorId} device_id set to NULL.`);
            res.status(200).json({ success: true, message: 'Sensor unassigned from device successfully.' });
        } else {
            console.log(`🟠 Sensor ${sensorId} not found or already unassigned.`);
            res.status(404).json({ success: false, message: 'Sensor not found or already unassigned.' });
        }
    } catch (error) {
        console.error(`🔴 Error unassigning device from sensor ${sensorId}:`, error);
        res.status(500).json({ success: false, message: 'Server error unassigning sensor.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// PUT /api/user/profile - Update user profile information
app.put('/api/super-admin/profile', authenticateToken, async (req, res) => {
    const { username, email, phone } = req.body;

    const userId = req.user.id;

    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE users SET username = ?, email = ?, phone = ? WHERE id = ?',
            [username, email, phone, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Fetch the updated user data to send back
        const [rows] = await connection.execute(
            'SELECT username, email, phone FROM users WHERE id = ?',
            [userId]
        );
        const updatedUser = rows[0];

        res.status(200).json({ message: 'Profile updated successfully!', user: updatedUser });

    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already exists.' });
        }
        res.status(500).json({ message: 'Failed to update profile due to a server error.' });
    } finally {
        if (connection) connection.release(); // Release the connection
    }
});

// POST /api/user/change-password - Change user password
app.post('/api/super-admin/change-password', authenticateToken, async (req, res) => {

    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    // 1. Basic input validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // 2. Retrieve current hashed password from database
        // Ensure column name 'password_hash' matches the actual column name in your database
        const [rows] = await connection.execute(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        // 3. Handle case where user is not found
        if (rows.length === 0) {
            // This 404 is good for "user not found based on ID",
            // but in a fully authenticated flow, a 401 Unauthorized might be more appropriate
            // if the user ID came from an invalid or missing token.
            return res.status(404).json({ message: 'User not found.' });
        }

        // IMPORTANT: Ensure you are accessing the correct column name from the result
        // If your column in the database is 'password_hash', then access 'password_hash'
        const storedHashedPassword = rows[0].password_hash; // Changed from hashed_password to password_hash

        // 4. Compare provided current password with stored hashed password
        const isMatch = await bcrypt.compare(currentPassword, storedHashedPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password.' });
        }

        // 5. Check if new password is the same as the current password (after hashing)
        // This is a good security practice.
        if (await bcrypt.compare(newPassword, storedHashedPassword)) {
            return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
        }

        // 6. Hash the new password
        const newHashedPassword = await bcrypt.hash(newPassword, 10); // 10 salt rounds is standard

        // 7. Update password in database
        const [result] = await connection.execute(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newHashedPassword, userId]
        );

        // 8. Check if the update actually affected a row
        if (result.affectedRows === 0) {
            // This could happen if the user was somehow deleted between select and update,
            // or if the userId didn't match. A 404 is still appropriate here.
            return res.status(404).json({ message: 'User not found or password already updated (no change needed).' });
        }

        // 9. Success response
        res.status(200).json({ message: 'Password changed successfully!' });

    } catch (error) {
        // 10. Centralized error handling for unexpected issues (e.g., database connection errors)
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Failed to change password due to a server error.' });
    } finally {
        // 11. Release the database connection back to the pool
        if (connection) connection.release();
    }
});

// PUT /api/super-admin/notifications - Update notification preference
app.put('/api/super-admin/notifications', async (req, res) => {
    const { receiveNotifications } = req.body;

    // In a real app, you'd get the current user ID from an authentication token
    const userId = "mock_user_id_123"; // For demonstration

    if (typeof receiveNotifications !== 'boolean') {
        return res.status(400).json({ message: 'Invalid data: receiveNotifications must be a boolean.' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE users SET receive_notifications = ? WHERE id = ?',
            [receiveNotifications, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({ message: 'Notification preference updated!', receiveNotifications: receiveNotifications });

    } catch (error) {
        console.error('Error updating notification preference:', error);
        res.status(500).json({ message: 'Failed to update notification preference due to a server error.' });
    } finally {
        if (connection) connection.release();
    }
});

// GET /api/super-admin/session-history - Get user's session history for settings page
app.get('/api/super-admin/session-history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 10;
        
        let sessionHistory;
        try {
            // Try to get from database first
            sessionHistory = await SessionHistory.getSessionHistoryByUser(userId, limit);
        } catch (error) {
            console.warn('Error fetching from database, using fallback data:', error);
            // Fallback data if database fails
            sessionHistory = [
                {
                    id: Date.now() - 86400000, // yesterday
                    user_id: userId,
                    username: req.user.username || 'User',
                    type: 'login',
                    ip_address: '192.168.1.1',
                    device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    timestamp: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: Date.now() - 85400000, // yesterday + 1 hour
                    user_id: userId,
                    username: req.user.username || 'User',
                    type: 'logout',
                    ip_address: '192.168.1.1',
                    device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    timestamp: new Date(Date.now() - 85400000).toISOString()
                },
                {
                    id: Date.now() - 3600000, // 1 hour ago
                    user_id: userId,
                    username: req.user.username || 'User',
                    type: 'login',
                    ip_address: '192.168.1.1',
                    device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                    timestamp: new Date(Date.now() - 3600000).toISOString()
                }
            ];
        }
        
        // Process the data to make it more user-friendly
        const processedHistory = sessionHistory.map(session => {
            // Extract device name from user agent
            let deviceName = 'Unknown Device';
            if (session.device_info) {
                if (session.device_info.includes('Windows')) deviceName = 'Windows PC';
                else if (session.device_info.includes('Macintosh')) deviceName = 'Mac';
                else if (session.device_info.includes('iPhone')) deviceName = 'iPhone';
                else if (session.device_info.includes('Android')) deviceName = 'Android Device';
                else if (session.device_info.includes('iPad')) deviceName = 'iPad';
                else if (session.device_info.includes('Linux')) deviceName = 'Linux PC';
            }
            
            return {
                id: session.id,
                username: session.username,
                type: session.type,
                timestamp: new Date(session.timestamp).toLocaleString(),
                device: deviceName,
                ipAddress: session.ip_address || 'Unknown IP'
            };
        });
        
        res.status(200).json({ success: true, data: processedHistory });
    } catch (error) {
        console.error('Error fetching session history for settings page:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch session history' });
    }
});

// =======================================================
// API Routes for your requirements
// =======================================================

// Route 1: Get establishment details for an admin
// This is typically called after login to set the context for the admin
app.get('/api/admin/:userId/establishments', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await pool.execute(
            `SELECT
                e.id AS establishment_id,
                e.estab_name,
                e.device_id
            FROM
                users u
            JOIN
                admin_establishments ae ON u.id = ae.user_id
            JOIN
                estab e ON ae.establishment_id = e.id
            WHERE
                u.id = ?`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching admin establishments:', error);
        res.status(500).json({ error: 'Failed to fetch establishments.' });
    }
});

// Route 2: Get list of sensors associated with a specific establishment
// Your frontend already calls this: http://localhost:5000/api/establishment/:establishmentId/sensors
app.get('/api/establishment/:establishmentId/sensors', async (req, res) => {
    const establishmentId = req.params.establishmentId;

    // Input validation: Always a good idea for route parameters
    if (!establishmentId) {
        return res.status(400).json({ error: 'Establishment ID is required to fetch sensors.' });
    }

    try {
        const [rows] = await pool.execute(
            `SELECT
                s.id AS sensor_id,
                s.sensor_name
            FROM
                estab_sensors es
            JOIN
                sensors s ON es.sensor_id = s.id
            WHERE
                es.estab_id = ?`,
            [establishmentId]
        );

        // Map the results to the desired format for the frontend
        // The frontend expects [{ name: "Sensor Name" }] or just ["Sensor Name"]
        // Your current map returns [{ id: ..., name: ... }], which the frontend handles via `sensor.name || sensor`.
        // This is fine, but if you only need the name, you can simplify.
        const activeSensors = rows.map(row => ({ id: row.sensor_id, name: row.sensor_name }));
        // OR, if the frontend only needs the name string:
        // const activeSensors = rows.map(row => row.sensor_name);


        // Add a console.log for successful fetches
        if (activeSensors.length > 0) {
            console.log(`Successfully fetched ${activeSensors.length} sensors for establishment ID: ${establishmentId}`);
            console.log('Sensors returned:', activeSensors.map(s => s.name).join(', ')); // Log just the names
        } else {
            console.warn(`No sensors found for establishment ID: ${establishmentId}`);
            // You might want to return an empty array, which your frontend already expects.
        }

        res.json(activeSensors);

    } catch (error) {
        // Make error logging more specific
        console.error(`Error fetching sensors for establishment ID ${establishmentId}:`, error);
        res.status(500).json({ error: `Failed to fetch sensors for establishment ID ${establishmentId}. Please try again later.` });
    }
});

// Route 3: Generic API endpoint for Historical Sensor Data
// Your frontend fetches from: http://localhost:5000/data/:sensorType/:filterType?establishmentId=:establishmentId
// --- Mappings for sensor data fetching ---
const sensorTableMap = {
    "turbidity": { tableName: "turbidity_readings", valueColumn: "turbidity_value" },
    // Corrected key: "phlevel" to match frontend apiPath "/phlevel"
    "phlevel": { tableName: "phlevel_readings", valueColumn: "ph_value" },
    // Corrected key: "tds" to match frontend apiPath "/tds"
    "tds": { tableName: "tds_readings", valueColumn: "tds_value" },
    "salinity": { tableName: "salinity_readings", valueColumn: "salinity_value" },
    "ec": { tableName: "ec_readings", valueColumn: "ec_value_mS" },
    "ec-compensated": { tableName: "ec_compensated_readings", valueColumn: "ec_compensated_mS" },
    "temperature": { tableName: "temperature_readings", valueColumn: "temperature_celsius" },
    "dissolved-oxygen": { tableName: "dissolved_oxygen_readings", valueColumn: "do_value_mg_l" }
    // If you have a separate "Conductivity" sensor with its own 'conductivity_readings' table
    // and an apiPath like "/conductivity", you would add it here:
    // "conductivity": { tableName: "conductivity_readings", valueColumn: "conductivity_value_mS" },
};

// // --- Generic route to fetch historical data for any sensor type ---
// app.get('/data/:sensorType/:filterType', async (req, res) => {
//     const { sensorType, filterType } = req.params;
//     const establishmentId = req.query.establishmentId;

//     if (!establishmentId) {
//         return res.status(400).json({ error: 'Establishment ID is required to fetch sensor data.' });
//     }

//     const sensorDefinition = sensorTableMap[sensorType];
//     if (!sensorDefinition) {
//         console.error(`Backend Error: Sensor type '${sensorType}' not found in sensorTableMap. Frontend apiPath mismatch?`);
//         return res.status(404).json({ error: `Sensor type '${sensorType}' not found or not configured.` });
//     }
//     const { tableName, valueColumn } = sensorDefinition;

//     let timeCondition = '';
//     let groupByClause = '';
//     let selectValueColumn = valueColumn;

//     switch (filterType) {
//         case 'realtime':
//             timeCondition = `AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`;
//             break;
//         case '24h':
//             timeCondition = `AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
//             break;
//         case '7d-avg':
//             timeCondition = `AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
//             groupByClause = `GROUP BY DATE(timestamp) ORDER BY DATE(timestamp) ASC`;
//             selectValueColumn = `AVG(${valueColumn}) AS value`;
//             break;
//         case '30d-avg':
//             timeCondition = `AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
//             groupByClause = `GROUP BY DATE(timestamp) ORDER BY DATE(timestamp) ASC`;
//             selectValueColumn = `AVG(${valueColumn}) AS value`;
//             break;
//         default:
//             return res.status(400).json({ error: 'Invalid filter type.' });
//     }

//     try {
//         const query = `
//             SELECT
//                 ${selectValueColumn},
//                 ${groupByClause ? 'DATE(timestamp) AS timestamp' : 'timestamp'}
//             FROM
//                 ${tableName}
//             WHERE
//                 establishment_id = ?
//                 ${timeCondition}
//             ${groupByClause};
//         `;
//         console.log(`Executing query for ${tableName} (estab: ${establishmentId}, filter: ${filterType}):\n${query}`);

//         const [rows] = await db.execute(query, [establishmentId]);

//         res.json(rows.map(row => ({
//             value: row.value !== undefined ? row.value : row[valueColumn],
//             timestamp: row.timestamp
//         })));

//     } catch (error) {
//         console.error(`Error fetching data for ${sensorType} (estab: ${establishmentId}, filter: ${filterType}):`, error);
//         res.status(500).json({ error: `Failed to fetch ${sensorType} sensor data. Details: ${error.message}` });
//     }
// });

// // --- NEW API ENDPOINT FOR DECLINING USER ACCESS ---
// app.post("/api/admin/decline-user-access", verifyToken, authorizeSuperAdmin, (req, res) => {
//     const { userId, notificationId } = req.body; // Expect userId and notificationId

//     if (!userId) {
//         return res.status(400).json({ message: "User ID is required for decline." });
//     }

//     // For declining, we typically don't change the user's is_verified status (it remains 0).
//     // The main action is to process/remove the notification from the Super Admin's view.
//     // If you had a 'status' column in a backend notifications table, you might update it:
//     // const updateNotificationSql = "UPDATE notifications SET status = 'declined' WHERE id = ?";
//     // db.query(updateNotificationSql, [notificationId], (err, updateResult) => { ... });

//     // For now, we'll just acknowledge success for the frontend to remove its copy.
//     console.log(`User ${userId}'s access request declined.`);
//     res.status(200).json({ message: "User access request declined successfully." });
// });

//ITO START NG ARDUINO GRRR RAWR RAWR HAHAHAHAHAH

// //Set up SerialPort (Change COM3 to your correct port)
// const serialPort = new SerialPort({ path: "COM3", baudRate: 9600 });
// const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

// //Read and store data from Arduino
// parser.on("data", (data) => {
//   try {
//     const jsonData = JSON.parse(data.trim());
//     const turbidityValue = jsonData.turbidity_value;

//     console.log("📡 Received Data:", turbidityValue);

//     // Insert into MySQL
//     const query = "INSERT INTO turbidity_readings (turbidity_value) VALUES (?)";
//     db.query(query, [turbidityValue], (err, result) => {
//       if (err) {
//         console.error("Database Insert Error:", err);
//       } else {
//         console.log("Data Inserted Successfully: ID", result.insertId);

//         // Emit real-time data update
//         io.emit("updateData", { value: turbidityValue });
//       }
//     });
//   } catch (err) {
//     console.error("JSON Parse Error:", err);
//   }
// });

// //API Route to Fetch Data
// app.get("/data", (req, res) => {
//   db.query("SELECT * FROM turbidity_readings ORDER BY id DESC LIMIT 10", (err, results) => {
//     if (err) {
//       return res.status(500).json({ error: "Database Query Error" });
//     }
//     res.json(results);
//   });
// });

// //Read and store data from Arduino
// parser.on("data", (data) => {
//   try {
//     const jsonData = JSON.parse(data.trim());

//     // Extract all sensor values from received JSON data
//     const turbidityValue = jsonData.turbidity_value;
//     const phValue = jsonData.ph_value;
//     const tdsValue = jsonData.tds_value;
//     const salinityValue = jsonData.salinity_value;
//     const ecValue = jsonData.ec_value_mS;
//     const ecCompensatedValue = jsonData.ec_compensated_mS;
//     const temperatureValue = jsonData.temperature_celsius;

//     // Handling Turbidity data

// if (turbidityValue !== undefined) {
//   console.log("📡 Received Turbidity Data:", turbidityValue);

//   // Insert into turbidity_readings
//   const query = "INSERT INTO turbidity_readings (turbidity_value) VALUES (?)";
//   db.query(query, [turbidityValue], (err, result) => {
//     if (err) {
//       console.error("❌ Turbidity Database Insert Error:", err.sqlMessage);
//       return;
//     }
//     console.log("✅ Turbidity Data Inserted Successfully: ID", result.insertId);

//     // Emit the turbidity data to clients via socket.io
//     io.emit("updateTurbidityData", { value: turbidityValue });

//     // Only insert the notification if turbidity is below threshold (40)
//     if (turbidityValue < 40) {
//       insertNotification(result.insertId, turbidityValue);
//     }
//   });
// }

//     // Handling pH data
//     if (phValue !== undefined) {
//       console.log("📡 Received pH Level Data:", phValue);
//       const query = "INSERT INTO phlevel_readings (ph_value) VALUES (?)";
//       db.query(query, [phValue], (err, result) => {
//         if (err) {
//           console.error("pH Database Insert Error:", err);
//         } else {
//           console.log("pH Data Inserted Successfully: ID", result.insertId);
//           io.emit("updatePHData", { value: phValue });
//         }
//       });
//     }

//     // Handling TDS data
//     if (tdsValue !== undefined) {
//       console.log("📡 Received TDS Data:", tdsValue);
//       const query = "INSERT INTO tds_readings (tds_value) VALUES (?)";
//       db.query(query, [tdsValue], (err, result) => {
//         if (err) {
//           console.error("TDS Database Insert Error:", err);
//         } else {
//           console.log("TDS Data Inserted Successfully: ID", result.insertId);
//           io.emit("updateTDSData", { value: tdsValue });
//         }
//       });
//     }

//     // Handling Salinity data
//     if (salinityValue !== undefined) {
//       console.log("📡 Received Salinity Data:", salinityValue);
//       const query = "INSERT INTO salinity_readings (salinity_value) VALUES (?)";
//       db.query(query, [salinityValue], (err, result) => {
//         if (err) {
//           console.error("Salinity Database Insert Error:", err);
//         } else {
//           console.log("Salinity Data Inserted Successfully: ID", result.insertId);
//           io.emit("updateSalinityData", { value: salinityValue });
//         }
//       });
//     }

//     // Handling EC data
//     if (ecValue !== undefined) {
//       console.log("📡 Received EC Data (mS/cm):", ecValue);
//       const query = "INSERT INTO ec_readings (ec_value_mS) VALUES (?)";
//       db.query(query, [ecValue], (err, result) => {
//         if (err) {
//           console.error("EC Database Insert Error:", err);
//         } else {
//           console.log("EC Data Inserted Successfully: ID", result.insertId);
//           io.emit("updateECData", { value: ecValue });
//         }
//       });
//     }

//     // Handling EC (Compensated) data
//     if (ecCompensatedValue !== undefined) {
//       console.log("📡 Received Compensated EC Data (mS/cm):", ecCompensatedValue);
//       const query = "INSERT INTO ec_compensated_readings (ec_compensated_mS) VALUES (?)";
//       db.query(query, [ecCompensatedValue], (err, result) => {
//         if (err) {
//           console.error("Compensated EC Database Insert Error:", err);
//         } else {
//           console.log("Compensated EC Data Inserted Successfully: ID", result.insertId);
//           io.emit("updateECCompensatedData", { value: ecCompensatedValue });
//         }
//       });
//     }

//     // Handling Temperature data
//     if (temperatureValue !== undefined) {
//       console.log("📡 Received Temperature Data (°C):", temperatureValue);
//       const query = "INSERT INTO temperature_readings (temperature_celsius) VALUES (?)";
//       db.query(query, [temperatureValue], (err, result) => {
//         if (err) {
//           console.error("Temperature Database Insert Error:", err);
//         } else {
//           console.log("Temperature Data Inserted Successfully: ID", result.insertId);
//           io.emit("updateTemperatureData", { value: temperatureValue });
//         }
//       });
//     }

//   } catch (err) {
//     console.error("JSON Parse Error:", err);
//   }
// });

// // Backend: Separate event for turbidity and pH level
// parser.on("data", (data) => {
//   try {
//     const jsonData = JSON.parse(data.trim());

//     const turbidityValue = jsonData.turbidity_value;
//     const phValue = jsonData.ph_value;

//     if (turbidityValue !== undefined) {
//       console.log("📡 Received Turbidity Data:", turbidityValue);

//       // Emit turbidity data update
//       io.emit("updateTurbidityData", { value: turbidityValue });
//     }

//     if (phValue !== undefined) {
//       console.log("📡 Received pH Data:", phValue);

//       // Emit pH data update
//       io.emit("updatePHData", { value: phValue });
//     }

//   } catch (err) {
//     console.error("JSON Parse Error:", err);
//   }
// });

// let sensorConnected = false;  // To keep track of sensor connection status

// // Function to show the connection status
// function showSensorConnectionStatus(isConnected) {
//   if (isConnected) {
//     console.log("Sensor is connected.");
//   } else {
//     console.log("Sensor is disconnected.");
//   }
// }

// // Check if the sensor is connected when the port opens
// serialPort.on("open", () => {
//   if (!sensorConnected) {
//     sensorConnected = true;  // Set to connected
//     showSensorConnectionStatus(true);  // Show connected status
//   }
// });

// // Listen for data from the sensor
// parser.on("data", (data) => {
//   try {
//     const jsonData = JSON.parse(data.trim());
//     const turbidityValue = jsonData.turbidity_value;

//     console.log("📡 Received Data:", turbidityValue);

//     // Insert into MySQL
//     const query = "INSERT INTO turbidity_readings (turbidity_value) VALUES (?)";
//     db.query(query, [turbidityValue], (err, result) => {
//       if (err) {
//         console.error("Database Insert Error:", err);
//       } else {
//         console.log("Data Inserted Successfully: ID", result.insertId);
//       }
//     });
//   } catch (err) {
//     console.error("JSON Parse Error:", err);
//   }
// });

// // Handle sensor disconnection
// serialPort.on("close", () => {
//   if (sensorConnected) {
//     sensorConnected = false;  // Set to disconnected
//     showSensorConnectionStatus(false);  // Show disconnected status
//   }
// });
// __________________________________________
// const pool = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// // ✅ Route to get latest water quality data
// app.get("/api/sensors/latest", async (req, res) => {
//   try {
//     const [rows] = await pool.query(
//       `SELECT * FROM sensor_readings ORDER BY created_at DESC LIMIT 1`
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ message: "No water quality data found." });
//     }

//     res.json(rows[0]);
//   } catch (err) {
//     console.error("❌ Error fetching water quality data:", err.message);
//     res.status(500).json({ message: "Internal server error." });
//   }
// });

// // Middleware to authenticate JWT tokens
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

//   if (!token) {
//     return res.status(403).json({ error: "Token required" });
//   }

//   jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//     if (err) {
//       return res.status(403).json({ error: "Invalid token" });
//     }
//     req.user = user;
//     next();
//   });
// };

// // Get unread notifications
// app.get("/api/notifications/unread", authenticateToken, (req, res) => {
//   const query = "SELECT id, message, created_at, status FROM notifications WHERE status = 'Unread' ORDER BY created_at DESC";

//   db.query(query, (err, results) => {
//     if (err) {
//       console.error("❌ Error fetching notifications:", err);
//       return res.status(500).json({ error: "Failed to fetch notifications" });
//     }
//     res.json(results || []); // Send the unread notifications back to the client
//   });
// });

// Save user to the database
// app.post('/save-user', (req, res) => {
//   const { email, name } = req.body;

//   // Insert user data into the 'users' table
//   const query = 'INSERT INTO users (email, username) VALUES (?, ?)';
//   db.query(query, [email, name], (err, result) => {
//     if (err) {
//       console.error('Error saving user:', err);
//       return res.status(500).send('Error saving user');
//     }
//     res.status(200).send('User saved successfully');
//   });
// });

 // CLEAN VERSION NG BACKEND FOR GAUGE METER AND HISTORICAL DATA RAWR RAWR RAWR RAWR RAWR
 // CLEAN VERSION NG BACKEND FOR GAUGE METER AND HISTORICAL DATA RAWR RAWR RAWR RAWR RAWR
 // CLEAN VERSION NG BACKEND FOR GAUGE METER AND HISTORICAL DATA RAWR RAWR RAWR RAWR RAWR
 // CLEAN VERSION NG BACKEND FOR GAUGE METER AND HISTORICAL DATA RAWR RAWR RAWR RAWR RAWR

app.post("/api/sensor-data", async (req, res) => {
  try {
    const jsonData = req.body;
    console.log("📡 Received data from local bridge:", jsonData);

    // Define notification configurations for each sensor
    const notifications = {
      turbidity: { sensorType: "turbidity", threshold: 30, condition: "lessThan", unit: "Percent" },
      ph: { sensorType: "ph", threshold: [0.5, 8.5], condition: "outsideRange", unit: "pH" },
      tds: { sensorType: "tds", threshold: 30, condition: "lessThan", unit: "Percent" },
      salinity: { sensorType: "salinity", threshold: 30, condition: "lessThan", unit: "Percent" },
      ec: { sensorType: "ec", threshold: 30, condition: "lessThan", unit: "Percent" },
      temperature: { sensorType: "temperature", threshold: [1, 50], condition: "outsideRange", unit: "°C" },
    };
    
    // Call the function to handle data insertion and Socket.IO emissions
    const {
      turbidity_value,
      ph_value,
      tds_value,
      salinity_value,
      ec_value_mS,
      ec_compensated_mS,
      temperature_celsius,
    } = jsonData;

    // Use Promise.all to run all database insertions in parallel
    await Promise.all([
      insertAndEmit("turbidity_readings", "turbidity_value", turbidity_value, "updateTurbidityData", notifications.turbidity),
      insertAndEmit("phlevel_readings", "ph_value", ph_value, "updatePHData", notifications.ph),
      insertAndEmit("tds_readings", "tds_value", tds_value, "updateTDSData", notifications.tds),
      insertAndEmit("salinity_readings", "salinity_value", salinity_value, "updateSalinityData", notifications.salinity),
      insertAndEmit("ec_readings", "ec_value_mS", ec_value_mS, "updateECData", notifications.ec),
      insertAndEmit("ec_compensated_readings", "ec_compensated_mS", ec_compensated_mS, "updateECCompensatedData", notifications.ec),
      insertAndEmit("temperature_readings", "temperature_celsius", temperature_celsius, "updateTemperatureData", notifications.temperature),
    ]);

    res.status(200).send("Data received and processed successfully.");

  } catch (err) {
    console.error("Error processing data:", err.message);
    res.status(500).send("Internal Server Error");
  }
});


// -----------------------------------------------------------------
// === HELPER FUNCTIONS ===
// -----------------------------------------------------------------
const insertAndEmit = async (
  tableName,
  valueColumn,
  value,
  socketEventName,
  notificationConfig = null
) => {
  if (value !== undefined && value !== null) {
    console.log(`📡 Processing ${valueColumn} Data:`, value);
    const query = `INSERT INTO ${tableName} (${valueColumn}, timestamp) VALUES (?, ?)`;
    try {
      const [result] = await db.query(query, [value, new Date()]);
      console.log(`✅ ${tableName} Data Inserted Successfully: ID`, result.insertId);

      io.emit(socketEventName, {
        value: value,
        timestamp: new Date().toISOString(),
      });

      if (notificationConfig) {
        await insertNotification(
          notificationConfig.sensorType,
          value,
          notificationConfig.threshold,
          notificationConfig.condition,
          notificationConfig.unit
        );
      }
    } catch (err) {
      console.error(
        `❌ ${tableName} Database Insert Error:`,
        err.sqlMessage || err.message
      );
    }
  }
};

async function insertNotification(
  sensorType,
  currentValue,
  threshold,
  condition,
  unit = ""
) {
  const type = "Sensor Alert";
  let title = `${sensorType.charAt(0).toUpperCase() + sensorType.slice(1)} Alert`;
  let message = "";
  let priority = "High";

  switch (sensorType) {
    case "turbidity":
    case "tds":
    case "salinity":
    case "ec":
      if (condition === "lessThan" && currentValue < threshold) {
        message = `🛑 Critical Water Quality Alert: ${sensorType} Safety Score is ${currentValue}${unit}. This is below safe limits. Please check the water tank or inspect the sensor for possible damage. Water is not recommended for drinking or use until resolved.`;
        priority = "Critical";
      } else if (currentValue >= 31 && currentValue <= 70) {
        message = `⚠️ Warning: ${sensorType} Safety Score is ${currentValue}${unit}, which is below the Philippine National Standard for Drinking Water (2017). This Water is not Safe for Drinking. Avoid using this water for drinking or cooking. Please report this issue to the proper authorities for further testing and immediate action.`;
        priority = "High";
      }
      break;
    case "ph":
      if (condition === "outsideRange") {
        const [lowerBound, upperBound] = threshold;
        if (currentValue < lowerBound || currentValue > upperBound) {
          message = `⚠️ Alert: The pH level is currently ${currentValue}${unit}, which is outside the safe range (${lowerBound}-${upperBound}${unit}). This water may be unsafe to drink. Please avoid use and report the issue to the appropriate authority.`;
          priority = "High";
        }
      }
      break;
    case "temperature":
      if (condition === "outsideRange") {
        const [lowerBound, upperBound] = threshold;
        if (currentValue < lowerBound || currentValue > upperBound) {
          message = `⚠️ Alert: Temperature is outside the optimal range (${lowerBound}-${upperBound}${unit}). Current reading: ${currentValue}${unit}. Inspect the water system or environment for potential issues affecting temperature stability.`;
          priority = "High";
        }
      }
      break;
    default:
      console.warn(`Unknown sensor type for notification: ${sensorType}`);
      return;
  }

  if (!message) {
    return;
  }

  const notifQuery = `
        INSERT INTO notif (type, title, message, timestamp, priority)
        VALUES (?, ?, ?, NOW(), ?)
    `;

  try {
    const [notifResult] = await db.query(notifQuery, [
      type,
      title,
      message,
      priority,
    ]);
    console.log("⚠️ Notification Inserted Successfully: ID", notifResult.insertId);
    io.emit("newNotification", {
      id: notifResult.insertId,
      type: type,
      title: title,
      message: message,
      timestamp: new Date().toISOString(),
      priority: priority,
    });
  } catch (notifErr) {
    console.error(
      "❌ Notification Insert Error:",
      notifErr.sqlMessage || notifErr.message
    );
  }
}

// --- API Endpoint for Latest Sensor Data (for initial frontend load) ---
app.get("/api/sensors/latest", async (req, res) => {
  const query = `
        SELECT
            (SELECT turbidity_value FROM turbidity_readings ORDER BY timestamp DESC LIMIT 1) AS turbidity_value,
            (SELECT ph_value FROM phlevel_readings ORDER BY timestamp DESC LIMIT 1) AS ph_value,
            (SELECT tds_value FROM tds_readings ORDER BY timestamp DESC LIMIT 1) AS tds_value,
            (SELECT salinity_value FROM salinity_readings ORDER BY timestamp DESC LIMIT 1) AS salinity_value,
            (SELECT ec_value_mS FROM ec_readings ORDER BY timestamp DESC LIMIT 1) AS ec_value_mS,
            (SELECT ec_compensated_mS FROM ec_compensated_readings ORDER BY timestamp DESC LIMIT 1) AS ec_compensated_mS,
            (SELECT temperature_celsius FROM temperature_readings ORDER BY timestamp DESC LIMIT 1) AS temperature_celsius,
            (SELECT timestamp FROM turbidity_readings ORDER BY timestamp DESC LIMIT 1) AS timestamp_turbidity
        FROM DUAL;
    `;

  try {
    const [results] = await db.query(query);
    if (results && results.length > 0 && results[0].turbidity_value !== null) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: "No latest sensor data found in the database." });
    }
  } catch (err) {
    console.error("Database Query Error for /api/sensors/latest:", err);
    return res.status(500).json({ error: "Database Query Error" });
  }
});

// --- Historical Data Endpoints (as provided in your previous snippet) ---
const getHistoricalData = async (tableName, valueColumn, timePeriod, res) => {
  let query;
  let params = [];

  switch (timePeriod) {
    case "realtime":
      query = `SELECT ${valueColumn} AS value, timestamp FROM ${tableName} WHERE timestamp >= NOW() - INTERVAL 20 MINUTE ORDER BY timestamp ASC`;
      break;
    case "24h":
      query = `SELECT ${valueColumn} AS value, timestamp FROM ${tableName} WHERE timestamp >= NOW() - INTERVAL 24 HOUR ORDER BY timestamp ASC`;
      break;
    case "7d-avg":
      query = `
        SELECT
            DATE(timestamp) AS timestamp,
            AVG(${valueColumn}) AS value
        FROM ${tableName}
        WHERE timestamp >= NOW() - INTERVAL 7 DAY
        GROUP BY DATE(timestamp)
        ORDER BY timestamp ASC
      `;
      break;
    case "30d-avg":
      query = `
        SELECT
            DATE(MIN(timestamp)) AS timestamp,
            AVG(${valueColumn}) AS value
        FROM ${tableName}
        WHERE timestamp >= NOW() - INTERVAL 30 DAY
        GROUP BY
            FLOOR(DATEDIFF(timestamp, '2000-01-01') / 3)
        ORDER BY
            timestamp ASC
      `;
      break;
    default:
      return res.status(400).json({ error: "Invalid time period specified." });
  }

  try {
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (err) {
    console.error(`Database Query Error for ${tableName} (${timePeriod}):`, err);
    return res.status(500).json({ error: "Database Query Error" });
  }
};

app.get("/data/turbidity/realtime", (req, res) => getHistoricalData('turbidity_readings', 'turbidity_value', 'realtime', res));
app.get("/data/turbidity/24h", (req, res) => getHistoricalData('turbidity_readings', 'turbidity_value', '24h', res));
app.get("/data/turbidity/7d-avg", (req, res) => getHistoricalData('turbidity_readings', 'turbidity_value', '7d-avg', res));
app.get("/data/turbidity/30d-avg", (req, res) => getHistoricalData('turbidity_readings', 'turbidity_value', '30d-avg', res));

app.get("/data/phlevel/realtime", (req, res) => getHistoricalData('phlevel_readings', 'ph_value', 'realtime', res));
app.get("/data/phlevel/24h", (req, res) => getHistoricalData('phlevel_readings', 'ph_value', '24h', res));
app.get("/data/phlevel/7d-avg", (req, res) => getHistoricalData('phlevel_readings', 'ph_value', '7d-avg', res));
app.get("/data/phlevel/30d-avg", (req, res) => getHistoricalData('phlevel_readings', 'ph_value', '30d-avg', res));

app.get("/data/tds/realtime", (req, res) => getHistoricalData('tds_readings', 'tds_value', 'realtime', res));
app.get("/data/tds/24h", (req, res) => getHistoricalData('tds_readings', 'tds_value', '24h', res));
app.get("/data/tds/7d-avg", (req, res) => getHistoricalData('tds_readings', 'tds_value', '7d-avg', res));
app.get("/data/tds/30d-avg", (req, res) => getHistoricalData('tds_readings', 'tds_value', '30d-avg', res));

app.get("/data/salinity/realtime", (req, res) => getHistoricalData('salinity_readings', 'salinity_value', 'realtime', res));
app.get("/data/salinity/24h", (req, res) => getHistoricalData('salinity_readings', 'salinity_value', '24h', res));
app.get("/data/salinity/7d-avg", (req, res) => getHistoricalData('salinity_readings', 'salinity_value', '7d-avg', res));
app.get("/data/salinity/30d-avg", (req, res) => getHistoricalData('salinity_readings', 'salinity_value', '30d-avg', res));

app.get("/data/ec/realtime", (req, res) => getHistoricalData('ec_readings', 'ec_value_mS', 'realtime', res));
app.get("/data/ec/24h", (req, res) => getHistoricalData('ec_readings', 'ec_value_mS', '24h', res));
app.get("/data/ec/7d-avg", (req, res) => getHistoricalData('ec_readings', 'ec_value_mS', '7d-avg', res));
app.get("/data/ec/30d-avg", (req, res) => getHistoricalData('ec_readings', 'ec_value_mS', '30d-avg', res));

app.get("/data/ec-compensated/realtime", (req, res) => getHistoricalData('ec_compensated_readings', 'ec_compensated_mS', 'realtime', res));
app.get("/data/ec-compensated/24h", (req, res) => getHistoricalData('ec_compensated_readings', 'ec_compensated_mS', '24h', res));
app.get("/data/ec-compensated/7d-avg", (req, res) => getHistoricalData('ec_compensated_readings', 'ec_compensated_mS', '7d-avg', res));
app.get("/data/ec-compensated/30d-avg", (req, res) => getHistoricalData('ec_compensated_readings', 'ec_compensated_mS', '30d-avg', res));

app.get("/data/temperature/realtime", (req, res) => getHistoricalData('temperature_readings', 'temperature_celsius', 'realtime', res));
app.get("/data/temperature/24h", (req, res) => getHistoricalData('temperature_readings', 'temperature_celsius', '24h', res));
app.get("/data/temperature/7d-avg", (req, res) => getHistoricalData('temperature_readings', 'temperature_celsius', '7d-avg', res));
app.get("/data/temperature/30d-avg", (req, res) => getHistoricalData('temperature_readings', 'temperature_celsius', '30d-avg', res));

// -----------------------------------------------------------------
// === START THE SERVER ===
// -----------------------------------------------------------------
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});