// src/components/AccessRestrictedModal.jsx
import React, { useState, useEffect } from "react"; // Import useEffect
import "../styles/Components Css/AccessRestrictedModal.css";

const AccessRestrictedModal = ({ isOpen, onClose, onRequestSend, message, showDeviceIdInput = true }) => {
    // If the modal is not open, don't render anything
    if (!isOpen) return null;

    // State to hold the device ID input by the user
    // Reset deviceIdInput when the modal opens or showDeviceIdInput changes
    const [deviceIdInput, setDeviceIdInput] = useState("");

    // Use useEffect to reset deviceIdInput when modal opens or showDeviceIdInput changes
    useEffect(() => {
        if (isOpen) {
            setDeviceIdInput(""); // Clear input when modal opens
        }
    }, [isOpen]); // Depend on isOpen

    // Function to handle the send request button click
    const handleSendRequestClick = () => {
        // Pass the deviceIdInput to the onRequestSend function
        onRequestSend(deviceIdInput);
        // Show the browser alert
        alert("Request successfully sent!");
        // Optionally, close the modal immediately after sending the request,
        // or let the parent component (Userdb) handle it based on response
        // onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content-access">
                <h2 className="modal-title">Access Restricted</h2>
                <p className="modal-message">
                    {/* Display dynamic message */}
                    {message}
                </p>

                {/* Conditionally render the input field for Device ID */}
                {showDeviceIdInput && (
                    <div className="device-id-input-container">
                        <label htmlFor="deviceId" className="device-id-label">Device ID:</label>
                        <input
                            type="text"
                            id="deviceId"
                            className="device-id-input"
                            value={deviceIdInput}
                            onChange={(e) => setDeviceIdInput(e.target.value)}
                            placeholder="Enter your device ID"
                        />
                    </div>
                )}

                <div className="modal-actions">
                    {/* Only show "Send Access Request" button if input is needed and not empty */}
                    {showDeviceIdInput && (
                        <button
                            className="modal-button send-request"
                            onClick={handleSendRequestClick}
                            // Disable button if deviceIdInput is empty or just whitespace
                            disabled={!deviceIdInput.trim()}
                        >
                            Send Access Request
                        </button>
                    )}
                    {/* If showDeviceIdInput is false, it means request has been sent,
                        so the message will indicate waiting for approval, and no input is needed.
                        We can still show a button to acknowledge/log out. */}
                    {!showDeviceIdInput && (
                           <button
                             className="modal-button send-request" // Reusing style for general action
                             onClick={onClose} // Just close the modal if no input needed
                           >
                             OK / Close
                           </button>
                    )}
                    <button className="modal-button logout" onClick={onClose}>
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccessRestrictedModal;