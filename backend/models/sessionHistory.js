// models/sessionHistory.js
const pool = require('../config/db');

class SessionHistory {
    /**
     * Record a user session event (login/logout)
     * @param {number} userId - The ID of the user
     * @param {string} username - The username of the user
     * @param {string} sessionType - The session event type ('login' or 'logout')
     * @param {string|null} ipAddress - IP address of the user (optional)
     * @param {string|null} deviceInfo - User agent or device information (optional)
     * @returns {Promise<number>} - The ID of the newly created session history record
     */
    static async recordSession(userId, username, sessionType, ipAddress = null, deviceInfo = null) {
        if (!userId || !username || !sessionType) {
            throw new Error('Missing required parameters: userId, username, or sessionType');
        }

        try {
            console.log('Recording session:', { userId, username, sessionType, ipAddress, deviceInfo });
            
            const [result] = await pool.execute(
                `INSERT INTO session_history 
                (user_id, username, session_type, ip_address, device_info, timestamp) 
                VALUES (?, ?, ?, ?, ?, NOW())`,
                [userId, username, sessionType, ipAddress, deviceInfo]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error recording session history:', error);
            throw error;
        }
    }

    /**
     * Get session history for a specific user
     * @param {number} userId - The ID of the user
     * @param {number} limit - Maximum number of records to return (default 20)
     * @returns {Promise<Array>} - Array of session history records
     */
    static async getSessionHistoryByUser(userId, limit = 20) {
        if (!userId) throw new Error('Missing required parameter: userId');

        try {
            const [rows] = await pool.execute(
                `SELECT * FROM session_history 
                 WHERE user_id = ? 
                 ORDER BY timestamp DESC 
                 LIMIT ?`,
                [userId, limit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching session history for user:', error);
            throw error;
        }
    }

    /**
     * Get all session history records
     * @param {number} limit - Maximum number of records to return (default 100)
     * @returns {Promise<Array>} - Array of session history records
     */
    static async getAllSessionHistory(limit = 100) {
        try {
            const [rows] = await pool.execute(
                `SELECT * FROM session_history 
                 ORDER BY timestamp DESC 
                 LIMIT ?`,
                [limit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching all session history:', error);
            throw error;
        }
    }

    /**
     * Clear session history for a specific user
     * @param {number} userId - The ID of the user
     * @returns {Promise<number>} - Number of records deleted
     */
    static async clearUserSessionHistory(userId) {
        if (!userId) throw new Error('Missing required parameter: userId');

        try {
            const [result] = await pool.execute(
                `DELETE FROM session_history WHERE user_id = ?`,
                [userId]
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Error clearing user session history:', error);
            throw error;
        }
    }
}

module.exports = SessionHistory;
