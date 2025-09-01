import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Assuming you have a ThemeContext
import '../styles/Components Css/StandbyPage.css'; // Create this CSS file for styling
import '../styles/theme.css'; // For theme classes

const StandbyPage = () => {
    const { theme } = useContext(ThemeContext);

    return (
        <div className={`standby-page-container ${theme}`}>
            <div className="standby-card">
                <h1>Account Under Review</h1>
                <p>Thank you for registering!</p>
                <p>Your account is currently under review by our administrators.</p>
                <p>We will notify you via email once your account has been verified and approved.</p>
                <p>Please check back later.</p>
                <div className="loading-spinner"></div> {/* Optional: Add a simple loading spinner */}
            </div>
        </div>
    );
};

export default StandbyPage;