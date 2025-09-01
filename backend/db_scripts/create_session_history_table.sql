-- Create a session_history table to store user login/logout events
CREATE TABLE IF NOT EXISTS session_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    type ENUM('login', 'logout') NOT NULL,
    ip_address VARCHAR(45) NULL,
    device_info TEXT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint to users table
    CONSTRAINT fk_session_history_user
    FOREIGN KEY (user_id) 
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Create index for faster queries by user_id
CREATE INDEX idx_session_history_user_id ON session_history(user_id);

-- Create index for faster queries by timestamp
CREATE INDEX idx_session_history_timestamp ON session_history(timestamp);
