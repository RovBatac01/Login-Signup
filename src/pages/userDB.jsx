// src/pages/Userdb.jsx
import React, { useContext, useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar"; // Assuming you still use this, though not in the provided snippet's render
import Sidebar from "../components/Sidebar";
import styles from "../styles/Pages Css/Userdb.module.css";
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext
import Ph from "../DashboardMeters/Ph";
import Tds from "../DashboardMeters/Tds";
import Conductivity from "../DashboardMeters/Conductivity";
import Salinity from "../DashboardMeters/Salinity";
import Temperature from "../DashboardMeters/Temperature";
import Turbidity from "../DashboardMeters/Turbidity";
import ElectricalCon from "../DashboardMeters/ElectricalCon";
import AccessRestrictedModal from "../components/AccessRestrictedModal";
import { useNavigate, Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import InfoButton from "../components/InfoButton";
import WaterQualityInfoModal from "../components/WaterQualityInfoModal";
import axios from 'axios'; // Import axios for API calls
// Import socket.io-client and your socket instance
import io from 'socket.io-client';
import socket from '../DashboardMeters/socket'; // Make sure this path is correct
// Import Bootstrap components for Google login modal
import { Modal, Button, Form } from 'react-bootstrap';

// API base URL - make sure this matches your backend
const API_BASE_URL = "https://login-signup-3470.onrender.com";

// Simple AlertDialog component to replace browser alerts
const AlertDialog = ({ isOpen, message, onClose }) => {
    if (!isOpen) return null;

    // return (
    //     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
    //         <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm mx-auto text-center">
    //             <p className="text-lg font-semibold mb-4">{message}</p>
    //             <button
    //                 onClick={onClose}
    //                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
    //             >
    //                 OK
    //             </button>
    //         </div>
    //     </div>
    // );
};

const Userdb = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { currentUser, login, logout, getToken, deviceId, establishmentId } = useContext(AuthContext);
    const [showAccessModal, setShowAccessModal] = useState(false);
    const navigate = useNavigate();
    const [showWaterQualityInfo, setShowWaterQualityInfo] = useState(false);
    const [activeParameter, setActiveParameter] = useState('overview'); 
    
    // State for AlertDialog
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

    // --- States for the Global Warning Pop-up ---
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [warningTitle, setWarningTitle] = useState('⚠️ Water Quality Alert!');

    // Polling state to check for verification status periodically
    const [isPolling, setIsPolling] = useState(false);

    // NEW STATE: To store the sensors associated with the user's device
    const [associatedSensors, setAssociatedSensors] = useState([]);
    const [loadingSensors, setLoadingSensors] = useState(true);

    // Google Login Device Modal States
    const [showGoogleDeviceModal, setShowGoogleDeviceModal] = useState(false);
    const [googleDeviceId, setGoogleDeviceId] = useState('');
    const [googleDeviceError, setGoogleDeviceError] = useState('');
    const [isSubmittingGoogleDevice, setIsSubmittingGoogleDevice] = useState(false);
    const [googleAccessStatus, setGoogleAccessStatus] = useState(null);

    // Check for Google login device access requirement on component mount
    useEffect(() => {
        console.log("🔍 Checking for Google login device access flags");
        
        // Check if user needs device access (from Google login)
        const needsDeviceAccess = localStorage.getItem('needsDeviceAccess');
        const isGoogleLogin = localStorage.getItem('isGoogleLogin');
        
        console.log("🔍 needsDeviceAccess:", needsDeviceAccess);
        console.log("🔍 isGoogleLogin:", isGoogleLogin);
        
        if (needsDeviceAccess === 'true' && isGoogleLogin === 'true') {
            console.log("✅ Showing Google device modal");
            setShowGoogleDeviceModal(true);
        } else {
            console.log("❌ Not showing Google device modal");
        }
    }, []);

    // Google device access handlers
    const handleGoogleDeviceSubmit = async () => {
        if (!googleDeviceId.trim()) {
            setGoogleDeviceError('Device ID is required');
            return;
        }

        setIsSubmittingGoogleDevice(true);
        setGoogleDeviceError('');

        try {
            const token = getToken();
            const userId = currentUser?.id;
            const email = currentUser?.email;
            const username = currentUser?.username;

            console.log("🔄 Submitting Google device access request for:", { userId, deviceId: googleDeviceId, email, username });

            // Submit access request with device ID
            const requestResponse = await axios.post(`${API_BASE_URL}/api/request-device-access`, {
                userId: userId,
                deviceId: googleDeviceId.trim(),
                email: email,
                username: username
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (requestResponse.data.success) {
                setGoogleAccessStatus('pending');
                
                // Clear the flags
                localStorage.removeItem('needsDeviceAccess');
                localStorage.removeItem('isGoogleLogin');
                localStorage.setItem('accessStatus', 'pending');
                
                console.log("✅ Google access request submitted for device ID:", googleDeviceId);
                
                // Show success message and close modal after delay
                setTimeout(() => {
                    setShowGoogleDeviceModal(false);
                    // Refresh the page or update UI to show pending status
                    window.location.reload();
                }, 2000);
                
            } else {
                setGoogleDeviceError('Failed to submit access request. Please try again.');
            }
        } catch (error) {
            console.error("Error submitting Google access request:", error);
            setGoogleDeviceError(error.response?.data?.error || 'Failed to submit access request');
        } finally {
            setIsSubmittingGoogleDevice(false);
        }
    };

    const handleGoogleDeviceModalClose = () => {
        // Only allow closing if not pending
        if (googleAccessStatus !== 'pending') {
            setShowGoogleDeviceModal(false);
            setGoogleDeviceId('');
            setGoogleDeviceError('');
            // Clear flags
            localStorage.removeItem('needsDeviceAccess');
            localStorage.removeItem('isGoogleLogin');
        }
    };

    // Effect for initial setup and verification check and controlling AccessRestrictedModal visibility
    useEffect(() => {
        const user = currentUser;
        const isVerified = user?.isVerified || false;
        const currentDeviceIdFromContext = deviceId; // Use the top-level deviceId from context

        console.log("User verification status on load (from AuthContext):", isVerified);
        console.log("User Device ID on load (from AuthContext):", currentDeviceIdFromContext);
        console.log("Current User Object on load (from AuthContext):", currentUser);

        const showModalFlag = localStorage.getItem("showAccessModalOnLoad");

        // Prioritize showing the modal if no device ID is associated, as the user needs to input it.
        if (!currentDeviceIdFromContext) {
            setShowAccessModal(true);
            setIsPolling(false); // No need to poll for verification if deviceId input is the current step
            console.log("User needs to input Device ID. Modal forced open.");
        }
        // If deviceId is present, but user is not verified, and modal flag is set from previous navigation/registration
        else if (showModalFlag === "true" && !isVerified) {
            setShowAccessModal(true);
            localStorage.removeItem("showAccessModalOnLoad"); // Clear the flag after acting on it
            setIsPolling(true); // Start polling for verification
            console.log("User verified? No. Modal flag set. Modal opened for verification polling.");
        }
        // If the user is verified, hide the modal and stop polling
        else if (isVerified) {
            localStorage.removeItem("showAccessModalOnLoad"); // Clear the flag if user is now verified
            console.log("User is already verified, skipping access request modal.");
            setShowAccessModal(false);
            setIsPolling(false);
        }
        // Default case: ensure modal is closed if none of the above conditions are met.
        else {
            setShowAccessModal(false);
            setIsPolling(false);
            console.log("Modal not needed for current user state.");
        }

    }, [currentUser, deviceId, isPolling]); // Dependencies: currentUser, deviceId, and isPolling to react to changes


    // Effect for polling verification status
    useEffect(() => {
        let pollInterval;
        if (isPolling) {
            pollInterval = setInterval(() => {
                const storedUserString = localStorage.getItem("user");
                let updatedUser = null;
                let newIsVerified = false;

                if (storedUserString) {
                    try {
                        updatedUser = JSON.parse(storedUserString);
                        newIsVerified = String(updatedUser.isVerified).toLowerCase() === "true" || updatedUser.isVerified === true;
                        // Use AuthContext's login to update its state and localStorage
                        login(updatedUser, getToken()); // This ensures AuthContext is truly in sync
                    } catch (e) {
                        console.error("Error parsing user from localStorage during polling:", e);
                    }
                }

                console.log("Polling for verification status (from localStorage):", newIsVerified);
                // Also log the deviceId from the updated user during polling
                console.log("Polling for deviceId (from localStorage updatedUser):", updatedUser?.deviceId);

                if (newIsVerified) {
                    setShowAccessModal(false);
                    setIsPolling(false);
                    setAlertMessage("Your account has been verified! You can now access all features.");
                    setShowAlert(true);
                }
            }, 5000);
        }

        return () => {
            clearInterval(pollInterval);
        };
    }, [isPolling, login, getToken]); // Dependencies on login and getToken from AuthContext

    // --- Socket.IO Listener for Global Notifications ---
    useEffect(() => {
        const handleNewNotification = (notification) => {
            console.log('Userdb received new notification:', notification);

            // Check if the notification is relevant to the current user's device
            // This is a crucial step to avoid showing irrelevant notifications
            if (notification.deviceId === deviceId) {
                const cleanedMessage = notification.message.replace('⚠️ Alert: ', '');
                setWarningMessage(`${cleanedMessage} Please take actions now.`);
                setShowWarningPopup(true); // Show the pop-up
            } else {
                console.log("Notification not for this user's device:", notification.deviceId, "vs current:", deviceId);
            }
        };

        // Ensure the socket is connected before listening
        if (socket) {
            socket.on('newNotification', handleNewNotification);
        }

        return () => {
            // Clean up the event listener when the component unmounts
            if (socket) {
                socket.off('newNotification', handleNewNotification);
            }
        };
    }, [deviceId]); // Dependency on deviceId to ensure the listener is correctly configured for the current user's device

    // NEW EFFECT: Fetch sensors based on currentUser's deviceId and isVerified status
    useEffect(() => {
        const fetchAssociatedSensors = async () => {
            // Use deviceId and isVerified directly from AuthContext
            const userDeviceId = deviceId; // Use the top-level deviceId from context
            const isUserVerified = currentUser?.isVerified; // Use currentUser for isVerified as it's a direct property

            console.log("DEBUG: fetchAssociatedSensors called.");
            console.log("DEBUG: userDeviceId (from AuthContext):", userDeviceId);
            console.log("DEBUG: isUserVerified (from AuthContext):", isUserVerified);
            console.log("DEBUG: currentUser object:", currentUser);

            // Only proceed if deviceId exists AND user is verified
            if (!userDeviceId || !isUserVerified) {
                console.log("Skipping sensor fetch: No userDeviceId or user not verified. Conditions not met.");
                setLoadingSensors(false);
                setAssociatedSensors([]); // Clear sensors if conditions aren't met
                return;
            }

            setLoadingSensors(true);
            try {
                const token = getToken(); // Get token from AuthContext
                if (!token) {
                    console.error("No token available for sensor fetch.");
                    setLoadingSensors(false);
                    return;
                }

                console.log(`Attempting to fetch sensors for device ID: ${userDeviceId}`);
                const response = await axios.get(`${API_BASE_URL}/api/devices/${userDeviceId}/sensors`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data) {
                    const normalizedSensors = response.data.map(sensor => {
                        return { ...sensor, normalized_sensor_name: sensor.sensor_name };
                    });

                    setAssociatedSensors(normalizedSensors);
                    console.log(`Fetched and normalized sensors for device ${userDeviceId}:`, normalizedSensors);
                } else {
                    console.error("No data received for sensors:", response);
                    setAlertMessage("Failed to load device sensors: No data received.");
                    setShowAlert(true);
                }
            } catch (error) {
                console.error("Error fetching associated sensors:", error.response?.data || error);
                setAlertMessage(error.response?.data?.error || "Error fetching device sensors.");
                setShowAlert(true);
            } finally {
                setLoadingSensors(false);
            }
        };

        // Only call fetchAssociatedSensors if currentUser is available
        // The dependency array now includes deviceId and currentUser.isVerified for reactivity
        // We ensure currentUser is not null/undefined before attempting to fetch
        if (currentUser) {
            fetchAssociatedSensors();
        }

    }, [currentUser, deviceId, getToken]); // Dependencies on currentUser, deviceId, and getToken from AuthContext

    const handleSendRequest = async (deviceIdFromModal) => {
        console.log("handleSendRequest function called.");
        console.log("Received deviceId from modal:", deviceIdFromModal);

        // Get user info directly from AuthContext
        const username = currentUser?.username || "Unknown User";
        const userId = currentUser?.id || "unknown-id";
        const deviceIdToSend = deviceIdFromModal || ""; // Use empty string if deviceIdFromModal is null/undefined

        console.log(`Extracted username: ${username}, userId: ${userId}, deviceIdToSend: ${deviceIdToSend}`);

        if (!deviceIdToSend || deviceIdToSend.trim() === "") {
            setAlertMessage("Please enter a valid Device ID to send the request.");
            setShowAlert(true);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/access-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fromUser: username,
                    fromUserId: userId,
                    deviceId: deviceIdToSend,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setAlertMessage(data.message);
                setShowAlert(true);
                setIsPolling(true);
                if (data.user && data.token) {
                    login(data.user, data.token); // Update AuthContext with any new user/token data
                }
            } else {
                setAlertMessage(data.message || 'An error occurred while sending your request.');
                setShowAlert(true);
            }
        } catch (error) {
            console.error("Network or fetch error:", error);
            setAlertMessage("Could not connect to the server. Please try again later.");
            setShowAlert(true);
        }
    };

    const handleCloseModal = () => {
        console.log("Access Restricted Modal closed.");
        setShowAccessModal(false);
        setIsPolling(false);
        logout(); // Use AuthContext's logout to ensure full cleanup
    };

    // Sensor component mapping - these keys MUST EXACTLY match the 'sensor_name' from your backend API response
    const sensorComponentsMap = {
        'Turbidity': Turbidity,
        'Temperature': Temperature,
        'Salinity': Salinity,
        'Conductivity': Conductivity,
        'Total Dissolved Solids': Tds,
        'ph Level': Ph,
        'Electrical Conductivity': ElectricalCon,
    };

    // Determine current verification and device ID from AuthContext
    const currentIsUserVerified = currentUser?.isVerified || false;
    // Use the directly destructured deviceId from context for render logic
    const currentDeviceId = deviceId || null;

    // Render loading state for sensors
    if (loadingSensors) {
        return (
            <div className={`${styles.userDb} ${theme}`}>
                <div className={styles.userDbContainer}>
                    <Sidebar theme={theme} toggleTheme={toggleTheme} />
                    <div className={styles.userDbContents}>
                        <p>Loading your device's sensors...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Render access restricted message if not verified AND no device ID set,
    // or if the modal is explicitly being shown (e.g., to input device ID)
    if (!currentIsUserVerified || !currentDeviceId || showAccessModal) {
        return (
            <div className={`${styles.userDb} ${theme}`}>
                <div className={styles.userDbContainer}>
                    <Sidebar theme={theme} toggleTheme={toggleTheme} />
                    <div className={styles.userDbContents}>
                        <p>No sensors associated with your device, or waiting for verification.</p>
                    </div>
                </div>
                <AccessRestrictedModal
                    isOpen={showAccessModal || (!currentIsUserVerified && !isPolling)} // Keep modal open if conditions require it
                    onClose={handleCloseModal}
                    onRequestSend={handleSendRequest}
                    message={
                        // This message will still change based on currentDeviceId,
                        // but the input will always be there if showDeviceIdInput is true below.
                        !currentDeviceId
                            ? "Please enter your Device ID to send an access request and get started."
                            : "You need Admin approval to view dashboard features.  Enter your Device ID to request access. Please wait for approval to continue or log out."
                    }
                    showDeviceIdInput={true} // FORCED TRUE: Always show the input field
                />
                <AlertDialog
                    isOpen={showAlert}
                    message={alertMessage}
                    onClose={() => setShowAlert(false)}
                />
                {/* Google Login Device Access Modal */}
                <Modal 
                    show={showGoogleDeviceModal} 
                    onHide={googleAccessStatus === 'pending' ? undefined : handleGoogleDeviceModalClose}
                    backdrop="static"
                    keyboard={false}
                    centered
                >
                    <Modal.Header closeButton={googleAccessStatus !== 'pending'}>
                        <Modal.Title>
                            {googleAccessStatus === 'pending' ? '✅ Access Request Submitted' : '🔐 Complete Your Google Login'}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {googleAccessStatus === 'pending' ? (
                            <div className="text-center">
                                <div className="mb-3">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                                <h5 className="text-success mb-3">Request Submitted Successfully!</h5>
                                <p className="mb-2">
                                    Your access request for device <strong>{googleDeviceId}</strong> has been submitted.
                                </p>
                                <p className="mb-2">
                                    An admin will review your request and approve access to the device.
                                </p>
                                <p className="text-muted small">
                                    The page will refresh to show your current status.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="mb-3">
                                    Welcome! To complete your Google login, please enter the Device ID you want to access. 
                                    Your request will be sent to the admin for approval.
                                </p>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Enter the Device ID you want to access"
                                        value={googleDeviceId}
                                        onChange={(e) => {
                                            setGoogleDeviceId(e.target.value);
                                            setGoogleDeviceError('');
                                        }}
                                        disabled={isSubmittingGoogleDevice}
                                        className={googleDeviceError ? 'is-invalid' : ''}
                                    />
                                    {googleDeviceError && (
                                        <div className="invalid-feedback d-block">
                                            {googleDeviceError}
                                        </div>
                                    )}
                                </Form.Group>

                                <div className="bg-light p-3 rounded">
                                    <h6 className="mb-2">📋 What happens next:</h6>
                                    <ol className="mb-0 ps-3 small">
                                        <li>Your access request will be sent to the device admin</li>
                                        <li>The admin will review and approve/deny your request</li>
                                        <li>You'll receive a notification once approved</li>
                                        <li>After approval, you can access device-specific features</li>
                                    </ol>
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        {googleAccessStatus !== 'pending' && (
                            <>
                                <Button 
                                    variant="secondary" 
                                    onClick={handleGoogleDeviceModalClose}
                                    disabled={isSubmittingGoogleDevice}
                                >
                                    Skip for Now
                                </Button>
                                <Button 
                                    variant="primary" 
                                    onClick={handleGoogleDeviceSubmit}
                                    disabled={isSubmittingGoogleDevice || !googleDeviceId.trim()}
                                >
                                    {isSubmittingGoogleDevice ? 'Submitting Request...' : 'Request Access'}
                                </Button>
                            </>
                        )}
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }

    return (
        <div className={`${styles.userDb} ${theme}`}>
            <div className={styles.userDbContainer}>
                <Sidebar theme={theme} toggleTheme={toggleTheme} />
                <div className={styles.userDbContents}>
                    <PageTitle title="DASHBOARD" />
                    <div className={styles.infoButtonContainer}>
                        <InfoButton onClick={() => setShowWaterQualityInfo(true)} text="Water Quality Information" />
                    </div>
                    <div className={styles.meterRowFlex}>
                        {associatedSensors.length > 0 ? (
                            associatedSensors.map((sensor) => {
                                const SensorComponent = sensorComponentsMap[sensor.normalized_sensor_name];
                                if (SensorComponent) {
                                    return (
                                        <div className={styles.meterWidget} key={sensor.id}>
                                            <div className={styles.meterLabel}>{sensor.sensor_name}</div>
                                            <SensorComponent deviceId={currentDeviceId} sensorId={sensor.id} />
                                        </div>
                                    );
                                }
                                return (
                                    <div key={sensor.id} className={`${styles.meterWidget} ${styles.noComponent}`}>
                                        <div className={styles.meterLabel}>{sensor.sensor_name}</div>
                                        <div>No dedicated display component for this sensor type.</div>
                                    </div>
                                );
                            })
                        ) : (
                            <p>No sensors found for your device.</p>
                        )}
                    </div>
                </div>
            </div>
            {/* These modals should ideally not be shown if currentIsUserVerified is true */}
            {/* But keeping them here in case they are triggered by other states */}
            <AccessRestrictedModal
                isOpen={showAccessModal}
                onClose={handleCloseModal}
                onRequestSend={handleSendRequest}
                message={
                    !currentDeviceId
                        ? "Please enter your Device ID to send an access request and get started."
                        : "You need Admin approval to view dashboard features. Enter your Device ID to request access. Please wait for approval to continue or log out."
                }
                showDeviceIdInput={true} // FORCED TRUE: Always show the input field
            />
            <AlertDialog
                isOpen={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
            />

            {/* Google Login Device Access Modal */}
            <Modal 
                show={showGoogleDeviceModal} 
                onHide={googleAccessStatus === 'pending' ? undefined : handleGoogleDeviceModalClose}
                backdrop="static"
                keyboard={false}
                centered
            >
                <Modal.Header closeButton={googleAccessStatus !== 'pending'}>
                    <Modal.Title>
                        {googleAccessStatus === 'pending' ? '✅ Access Request Submitted' : '🔐 Complete Your Google Login'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {googleAccessStatus === 'pending' ? (
                        <div className="text-center">
                            <div className="mb-3">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                            <h5 className="text-success mb-3">Request Submitted Successfully!</h5>
                            <p className="mb-2">
                                Your access request for device <strong>{googleDeviceId}</strong> has been submitted.
                            </p>
                            <p className="mb-2">
                                An admin will review your request and approve access to the device.
                            </p>
                            <p className="text-muted small">
                                The page will refresh to show your current status.
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="mb-3">
                                Welcome! To complete your Google login, please enter the Device ID you want to access. 
                                Your request will be sent to the admin for approval.
                            </p>
                            
                            <Form.Group className="mb-3">
                                <Form.Label>Device ID <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter the Device ID you want to access"
                                    value={googleDeviceId}
                                    onChange={(e) => {
                                        setGoogleDeviceId(e.target.value);
                                        setGoogleDeviceError('');
                                    }}
                                    disabled={isSubmittingGoogleDevice}
                                    className={googleDeviceError ? 'is-invalid' : ''}
                                />
                                {googleDeviceError && (
                                    <div className="invalid-feedback d-block">
                                        {googleDeviceError}
                                    </div>
                                )}
                            </Form.Group>

                            <div className="bg-light p-3 rounded">
                                <h6 className="mb-2">📋 What happens next:</h6>
                                <ol className="mb-0 ps-3 small">
                                    <li>Your access request will be sent to the device admin</li>
                                    <li>The admin will review and approve/deny your request</li>
                                    <li>You'll receive a notification once approved</li>
                                    <li>After approval, you can access device-specific features</li>
                                </ol>
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {googleAccessStatus !== 'pending' && (
                        <>
                            <Button 
                                variant="secondary" 
                                onClick={handleGoogleDeviceModalClose}
                                disabled={isSubmittingGoogleDevice}
                            >
                                Skip for Now
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleGoogleDeviceSubmit}
                                disabled={isSubmittingGoogleDevice || !googleDeviceId.trim()}
                            >
                                {isSubmittingGoogleDevice ? 'Submitting Request...' : 'Request Access'}
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Global Pop-up Warning Notification (Centered on Screen) */}
            {showWarningPopup && (
                <div className="warning-popup"> {/* Ensure you have this class in your CSS */}
                    <div className="popup-content"> {/* Ensure you have this class in your CSS */}
                        <h3>{warningTitle}</h3>
                        <p>{warningMessage}</p>
                        <button onClick={() => setShowWarningPopup(false)} className="close-popup">
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Water Quality Information Modal */}
            <WaterQualityInfoModal 
                isOpen={showWaterQualityInfo} 
                onClose={() => setShowWaterQualityInfo(false)}
                activeParameter={activeParameter}
            />
      
        </div>
    );
};

export default Userdb;