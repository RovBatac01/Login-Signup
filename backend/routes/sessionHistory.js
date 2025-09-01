// routes/sessionHistory.js
const express = require('express');
const router = express.Router();
const SessionHistory = require('../models/sessionHistory');
const authenticateUser = require('../middleware/authenticateUser');

// Middleware to extract client IP and device info
const extractClientInfo = (req, res, next) => {
    // Get IP address
    req.clientIp = req.headers['x-forwarded-for'] || 
                  req.connection.remoteAddress || 
                  req.socket.remoteAddress || 
                  req.connection.socket.remoteAddress;
    
    // Get device info from user agent
    req.deviceInfo = req.body.deviceInfo || req.headers['user-agent'];
    
    next();
};

// Record login session (called from login endpoint)
router.post('/login', authenticateUser, extractClientInfo, async (req, res) => {
    try {
        const userId = req.user.id;
        const username = req.user.username || req.body.username;
        
        await SessionHistory.recordSession(
            userId, 
            username, 
            'login', 
            req.clientIp, 
            req.deviceInfo
        );
        
        res.status(200).json({ success: true, message: 'Login session recorded' });
    } catch (error) {
        console.error('Error recording login session:', error);
        res.status(500).json({ success: false, message: 'Failed to record login session' });
    }
});

// Record logout session
router.post('/logout', authenticateUser, extractClientInfo, async (req, res) => {
    try {
        const userId = req.user.id;
        const username = req.user.username || req.body.username;
        
        await SessionHistory.recordSession(
            userId, 
            username, 
            'logout', 
            req.clientIp, 
            req.deviceInfo
        );
        
        res.status(200).json({ success: true, message: 'Logout session recorded' });
    } catch (error) {
        console.error('Error recording logout session:', error);
        res.status(500).json({ success: false, message: 'Failed to record logout session' });
    }
});

// Get user's session history
router.get('/user', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;
        
        const sessionHistory = await SessionHistory.getSessionHistoryByUser(userId, limit);
        
        res.status(200).json({ success: true, data: sessionHistory });
    } catch (error) {
        console.error('Error fetching user session history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch session history' });
    }
});

// Get all session history (admin only)
router.get('/all', authenticateUser, async (req, res) => {
    try {
        // Check if user is admin or super admin
        if (req.user.role !== 'Admin' && req.user.role !== 'Super Admin') {
            return res.status(403).json({ success: false, message: 'Access denied: Admin rights required' });
        }
        
        const limit = parseInt(req.query.limit) || 100;
        const sessionHistory = await SessionHistory.getAllSessionHistory(limit);
        
        res.status(200).json({ success: true, data: sessionHistory });
    } catch (error) {
        console.error('Error fetching all session history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch session history' });
    }
});

// Clear user's session history
router.delete('/user', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const deletedCount = await SessionHistory.clearUserSessionHistory(userId);
        
        res.status(200).json({ 
            success: true, 
            message: `Successfully cleared ${deletedCount} session history records`
        });
    } catch (error) {
        console.error('Error clearing user session history:', error);
        res.status(500).json({ success: false, message: 'Failed to clear session history' });
    }
});

module.exports = router;
