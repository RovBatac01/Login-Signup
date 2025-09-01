// models/sessionHistory.js
const db = require('../config/db');

class SessionHistory {
    /**
     * Record a user session event (login/logout)
     * @param {number} userId - The ID of the user
     * @param {string} username - The username of the user
     * @param {string} type - The session event type ('login' or 'logout')
     * @param {string} ipAddress - IP address of the user (optional)
     * @param {string} deviceInfo - User agent or device information (optional)
     * @returns {Promise<number>} - The ID of the newly created session history record
     */
    static async recordSession(userId, username, type, ipAddress = null, deviceInfo = null) {
        try {
            const [result] = await db.query(
                'INSERT INTO session_history (user_id, username, type, ip_address, device_info) VALUES (?, ?, ?, ?, ?)',
                [userId, username, type, ipAddress, deviceInfo]
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
     * @param {number} limit - Maximum number of records to return (optional, default 20)
     * @returns {Promise<Array>} - Array of session history records
     */
    static async getSessionHistoryByUser(userId, limit = 20) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM session_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
                [userId, limit]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching session history:', error);
            throw error;
        }
    }

    /**
     * Get all session history records
     * @param {number} limit - Maximum number of records to return (optional, default 100)
     * @returns {Promise<Array>} - Array of session history records
     */
    static async getAllSessionHistory(limit = 100) {
        try {
            const [rows] = await db.query(
                'SELECT * FROM session_history ORDER BY timestamp DESC LIMIT ?',
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
        try {
            const [result] = await db.query(
                'DELETE FROM session_history WHERE user_id = ?',
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
