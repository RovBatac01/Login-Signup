const db = require('../config/db');

class SessionHistory {
    static async recordSession(userId, username, type, ipAddress, deviceInfo) {
        try {
            const query = `
                INSERT INTO session_history (user_id, username, session_type, ip_address, device_info, timestamp)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;
            
            const [result] = await db.execute(query, [userId, username, type, ipAddress, deviceInfo]);
            return result;
        } catch (error) {
            console.error('Error recording session history:', error);
            throw error;
        }
    }
    
    static async getSessionHistoryByUser(userId, limit = 10) {
        try {
            const query = `
                SELECT * FROM session_history 
                WHERE user_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?
            `;
            
            const [rows] = await db.execute(query, [userId, limit]);
            return rows;
        } catch (error) {
            console.error('Error fetching session history:', error);
            throw error;
        }
    }
}

module.exports = SessionHistory;