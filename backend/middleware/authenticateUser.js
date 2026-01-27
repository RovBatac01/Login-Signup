const jwt = require('jsonwebtoken');

// Ensure you have a strong secret key for JWT.
// It's best practice to store this in an environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // Replace with a strong, actual secret

const authenticateUser = (req, res, next) => {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication token is required.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT verification error:", err.message);
            // Specifically check for 'TokenExpiredError' if you want to provide a specific message
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
            }
            return res.status(403).json({ success: false, message: 'Invalid or forbidden token.' });
        }
        // If verification is successful, 'user' will contain the payload
        // We assume your JWT payload contains at least an 'id' field for the user
        req.user = user; // Attach the decoded user payload to the request object
        next(); // Proceed to the next middleware/route handler
    });
};

module.exports = authenticateUser;