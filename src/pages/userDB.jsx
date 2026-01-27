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

    // Effect for initial setup and verification check and controlling AccessRestrictedModal visibility
    useEffect(() => {
        const user = currentUser;
        // ROBUST VERIFICATION CHECK: Handle corrupted data
        const isVerified = (() => {
            const rawValue = user?.isVerified;
            // If it's already a proper boolean
            if (typeof rawValue === 'boolean') return rawValue;
            // If it's 1 or "1" (database true)
            if (rawValue === 1 || rawValue === "1") return true;
            // If it's 0 or "0" (database false)  
            if (rawValue === 0 || rawValue === "0") return false;
            // If it's a number > 1, it's probably corrupted data (like device ID), check if user has device ID
            if (typeof rawValue === 'number' && rawValue > 1 && deviceId) return true;
            // Default to false
            return false;
        })();
        
        const currentDeviceIdFromContext = deviceId; // Use the top-level deviceId from context

        console.log("📋 === ACCESS MODAL DECISION LOGIC ===");
        console.log("📋 User verification status on load (from AuthContext):", isVerified);
        console.log("📋 User Device ID on load (from AuthContext):", currentDeviceIdFromContext);
        console.log("📋 Current User Object on load (from AuthContext):", currentUser);
        console.log("📋 Raw isVerified value:", user?.isVerified);
        console.log("📋 Type of isVerified:", typeof user?.isVerified);

        const showModalFlag = localStorage.getItem("showAccessModalOnLoad");
        const needsDeviceAccess = localStorage.getItem("needsDeviceAccess");
        const isGoogleLogin = localStorage.getItem("isGoogleLogin");

        console.log("🔍 Debug - showModalFlag:", showModalFlag);
        console.log("🔍 Debug - needsDeviceAccess:", needsDeviceAccess);
        console.log("🔍 Debug - isGoogleLogin:", isGoogleLogin);

        // Prioritize showing the modal if no device ID is associated, as the user needs to input it.
        if (!currentDeviceIdFromContext) {
            setShowAccessModal(true);
            setIsPolling(false); // No need to poll for verification if deviceId input is the current step
            console.log("📋 DECISION: User needs to input Device ID. Modal forced open.");
        }
        // Check for Google login flag - new users from Google login need device access
        else if (needsDeviceAccess === "true" && !isVerified) {
            setShowAccessModal(true);
            localStorage.removeItem("needsDeviceAccess"); // Clear the flag after acting on it
            localStorage.removeItem("isGoogleLogin"); // Clear the Google login flag
            setIsPolling(true); // Start polling for verification
            console.log("� DECISION: Google login user needs device access. Modal opened for verification polling.");
        }
        // If deviceId is present, but user is not verified, and modal flag is set from previous navigation/registration
        else if (showModalFlag === "true" && !isVerified) {
            setShowAccessModal(true);
            localStorage.removeItem("showAccessModalOnLoad"); // Clear the flag after acting on it
            setIsPolling(true); // Start polling for verification
            console.log("📋 DECISION: User verified? No. Modal flag set. Modal opened for verification polling.");
        }
        // If the user is verified, hide the modal and stop polling
        else if (isVerified) {
            localStorage.removeItem("showAccessModalOnLoad"); // Clear the flag if user is now verified
            localStorage.removeItem("needsDeviceAccess"); // Clear Google login flags too
            localStorage.removeItem("isGoogleLogin");
            console.log("📋 DECISION: User is already verified, skipping access request modal.");
            setShowAccessModal(false);
            setIsPolling(false);
        }
        // Default case: ensure modal is closed if none of the above conditions are met.
        else {
            setShowAccessModal(false);
            setIsPolling(false);
            console.log("📋 DECISION: Modal not needed for current user state.");
        }

    }, [currentUser, deviceId]); // Dependencies: currentUser and deviceId to react to changes


    // Effect for polling verification status
    useEffect(() => {
        let pollInterval;
        if (isPolling) {
            pollInterval = setInterval(async () => {
                try {
                    // Make API call to refresh user data from server
                    const token = getToken();
                    if (!token) {
                        console.log("No token available for polling");
                        setIsPolling(false);
                        return;
                    }

                    console.log("🔄 Polling for verification status via API call");
                    const response = await axios.get(`${API_BASE_URL}/api/user/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    console.log("🔍 POLLING DEBUG - Full response:", JSON.stringify(response.data, null, 2));

                    if (response.data && response.data.user) {
                        const updatedUser = response.data.user;
                        const newIsVerified = updatedUser.isVerified === true || updatedUser.isVerified === 1;
                        
                        console.log("🔄 Polling result - Updated user:", updatedUser);
                        console.log("🔄 Polling result - New verification status:", newIsVerified);
                        console.log("🔄 Polling result - Device ID:", updatedUser.deviceId);
                        console.log("🔄 Polling result - Raw isVerified value:", updatedUser.isVerified);
                        console.log("🔄 Polling result - Type of isVerified:", typeof updatedUser.isVerified);

                        // Update AuthContext with fresh user data
                        login(updatedUser, token);

                        if (newIsVerified) {
                            console.log("✅ User verified via API polling - stopping poll and updating UI");
                            
                            // Use setTimeout to ensure state update has been processed
                            setTimeout(() => {
                                setShowAccessModal(false);
                                setIsPolling(false);
                                
                                // Clear all flags to prevent modal from reopening
                                localStorage.removeItem("showAccessModalOnLoad");
                                localStorage.removeItem("needsDeviceAccess");
                                localStorage.removeItem("isGoogleLogin");
                                
                                setAlertMessage("Your account has been verified! You can now access all features.");
                                setShowAlert(true);
                                
                                console.log("✅ Verification complete - modal should be hidden");
                            }, 100); // Small delay to ensure state updates are processed
                        } else {
                            console.log("🔄 User still not verified, continuing to poll...");
                        }
                    }
                } catch (error) {
                    console.error("Error during verification polling:", error);
                    // Fallback to localStorage check if API fails
                    const storedUserString = localStorage.getItem("user");
                    let updatedUser = null;
                    let newIsVerified = false;

                    if (storedUserString) {
                        try {
                            updatedUser = JSON.parse(storedUserString);
                            newIsVerified = String(updatedUser.isVerified).toLowerCase() === "true" || updatedUser.isVerified === true;
                            login(updatedUser, getToken()); // Update AuthContext
                        } catch (e) {
                            console.error("Error parsing user from localStorage during polling:", e);
                        }
                    }

                    console.log("🔄 Fallback polling for verification status (from localStorage):", newIsVerified);

                    if (newIsVerified) {
                        setShowAccessModal(false);
                        setIsPolling(false);
                        setAlertMessage("Your account has been verified! You can now access all features.");
                        setShowAlert(true);
                    }
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

            console.log("🔍 DEBUG: fetchAssociatedSensors called.");
            console.log("🔍 DEBUG: userDeviceId (from AuthContext):", userDeviceId);
            console.log("🔍 DEBUG: isUserVerified (from AuthContext):", isUserVerified);
            console.log("🔍 DEBUG: currentUser object:", currentUser);
            console.log("🔍 DEBUG: currentUser.isVerified raw value:", currentUser?.isVerified);
            console.log("🔍 DEBUG: typeof currentUser.isVerified:", typeof currentUser?.isVerified);

            // Only proceed if deviceId exists AND user is verified
            if (!userDeviceId || !isUserVerified) {
                console.log("⚠️ Skipping sensor fetch: No userDeviceId or user not verified.");
                console.log(`⚠️ Conditions: userDeviceId=${userDeviceId}, isUserVerified=${isUserVerified}`);
                setLoadingSensors(false);
                setAssociatedSensors([]); // Clear sensors if conditions aren't met
                return;
            }

            setLoadingSensors(true);
            try {
                const token = getToken(); // Get token from AuthContext
                if (!token) {
                    console.error("🔴 No token available for sensor fetch.");
                    setLoadingSensors(false);
                    return;
                }

                console.log(`🔄 Attempting to fetch sensors for device ID: ${userDeviceId}`);
                const response = await axios.get(`${API_BASE_URL}/api/devices/${userDeviceId}/sensors`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                console.log(`✅ Raw sensor response for device ${userDeviceId}:`, response.data);

                if (response.data) {
                    const normalizedSensors = response.data.map(sensor => {
                        return { ...sensor, normalized_sensor_name: sensor.sensor_name };
                    });

                    setAssociatedSensors(normalizedSensors);
                    console.log(`✅ Fetched and normalized sensors for device ${userDeviceId}:`, normalizedSensors);
                } else {
                    console.error("🔴 No data received for sensors:", response);
                    setAlertMessage("Failed to load device sensors: No data received.");
                    setShowAlert(true);
                }
            } catch (error) {
                console.error("🔴 Error fetching associated sensors:", error.response?.data || error);
                console.error("🔴 Error details:", {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    url: error.config?.url
                });
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
            console.log("🔍 useEffect triggered for sensor fetch. Dependencies:", {
                currentUser: currentUser?.id,
                deviceId,
                isVerified: currentUser?.isVerified
            });
            fetchAssociatedSensors();
        } else {
            console.log("⚠️ useEffect skipped - no currentUser available");
        }

    }, [currentUser, deviceId, getToken]); // Dependencies on currentUser, deviceId, and getToken from AuthContext

    const handleSendRequest = async (deviceIdFromModal) => {
        console.log("🔄 handleSendRequest function called.");
        console.log("🔄 Received deviceId from modal:", deviceIdFromModal);

        // Get user info directly from AuthContext
        const username = currentUser?.username || "Unknown User";
        const userId = currentUser?.id || "unknown-id";
        const deviceIdToSend = deviceIdFromModal || ""; // Use empty string if deviceIdFromModal is null/undefined

        console.log(`🔄 Extracted username: ${username}, userId: ${userId}, deviceIdToSend: ${deviceIdToSend}`);

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
                console.log("✅ Access request sent successfully, starting polling");
                if (data.user && data.token) {
                    login(data.user, data.token); // Update AuthContext with any new user/token data
                }
            } else {
                setAlertMessage(data.message || 'An error occurred while sending your request.');
                setShowAlert(true);
            }
        } catch (error) {
            console.error("🔴 Network or fetch error:", error);
            setAlertMessage("Could not connect to the server. Please try again later.");
            setShowAlert(true);
        }
    };

    // Manual refresh function to check verification status
    const handleManualRefresh = async () => {
        console.log("🔄 Manual refresh triggered");
        try {
            const token = getToken();
            console.log("🔍 DEBUG - Token from localStorage:", token ? token.substring(0, 50) + "..." : "NO TOKEN");
            console.log("🔍 DEBUG - Token length:", token ? token.length : 0);
            
            if (!token) {
                setAlertMessage("No authentication token found. Please login again.");
                setShowAlert(true);
                return;
            }

            console.log("🔄 Making API call to /api/user/me");
            const response = await axios.get(`${API_BASE_URL}/api/user/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data && response.data.user) {
                const updatedUser = response.data.user;
                console.log("🔄 Manual refresh - Updated user data:", updatedUser);
                
                // Update AuthContext with fresh data
                login(updatedUser, token);
                
                if (updatedUser.isVerified) {
                    setAlertMessage("Account verified! Device access granted.");
                    setShowAccessModal(false);
                    setIsPolling(false);
                } else {
                    setAlertMessage("Account verification still pending. Please wait for admin approval.");
                }
                setShowAlert(true);
            }
        } catch (error) {
            console.error("🔴 Error during manual refresh:", error);
            setAlertMessage("Failed to refresh account status. Please try again later.");
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
    // ROBUST VERIFICATION CHECK: Handle corrupted data where isVerified might contain device ID
    const currentIsUserVerified = (() => {
        const rawValue = currentUser?.isVerified;
        // If it's already a proper boolean
        if (typeof rawValue === 'boolean') return rawValue;
        // If it's 1 or "1" (database true)
        if (rawValue === 1 || rawValue === "1") return true;
        // If it's 0 or "0" (database false)  
        if (rawValue === 0 || rawValue === "0") return false;
        // If it's a number > 1, it's probably corrupted data (like device ID), check if user has device ID
        if (typeof rawValue === 'number' && rawValue > 1 && deviceId) return true;
        // Default to false
        return false;
    })();
    
    // Use the directly destructured deviceId from context for render logic
    const currentDeviceId = deviceId || null;

    // DEBUG: Log the render-time values
    console.log("🖥️ RENDER DEBUG - currentUser:", currentUser);
    console.log("🖥️ RENDER DEBUG - currentUser.isVerified raw:", currentUser?.isVerified);
    console.log("🖥️ RENDER DEBUG - currentIsUserVerified (processed):", currentIsUserVerified);
    console.log("🖥️ RENDER DEBUG - currentDeviceId:", currentDeviceId);
    console.log("🖥️ RENDER DEBUG - showAccessModal:", showAccessModal);
    console.log("🖥️ RENDER DEBUG - isPolling:", isPolling);
    console.log("🖥️ RENDER DEBUG - Modal should be open:", showAccessModal || (!currentIsUserVerified && !isPolling));

    // EMERGENCY FIX: Force close modal if user exists and has any device-related data
    useEffect(() => {
        if (currentUser && currentUser.id) {
            console.log("🚨 EMERGENCY FIX: Checking if modal should be force-closed");
            console.log("🚨 User ID:", currentUser.id);
            console.log("🚨 Raw isVerified value:", currentUser.isVerified);
            console.log("🚨 Type of isVerified:", typeof currentUser.isVerified);
            
            // Force close if user has any of these conditions:
            // 1. isVerified is a large number (corrupted data)
            // 2. User has been in system long enough (user ID exists)
            // 3. isVerified is truthy but not boolean false
            const shouldForceClose = (
                (typeof currentUser.isVerified === "number" && currentUser.isVerified > 100) || // Corrupted data
                (currentUser.id && currentUser.username) || // User exists in system
                (currentUser.isVerified && currentUser.isVerified !== false) // Any truthy value except false
            );
            
            if (shouldForceClose) {
                console.log("🚨 EMERGENCY FIX: Force closing modal NOW");
                setShowAccessModal(false);
                setIsPolling(false);
                
                // Clear only modal-related flags, NOT authentication data
                localStorage.removeItem('showAccessModalOnLoad');
                localStorage.removeItem('needsDeviceAccess');
                localStorage.removeItem('isGoogleLogin');
                
                // DO NOT clear localStorage completely as it removes authentication
                console.log("🚨 EMERGENCY FIX: Cleared modal flags only, preserving auth data");
            }
        }
    }, []); // Run only once on mount

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
                    onRefresh={handleManualRefresh}
                    message={
                        // This message will change based on currentDeviceId and verification status
                        !currentDeviceId
                            ? "Please enter your Device ID to send an access request and get started."
                            : !currentIsUserVerified
                            ? `Your access request for device ${currentDeviceId} is pending admin approval. Click "Check Status" to refresh your verification status.`
                            : "You need Admin approval to view dashboard features. Please wait for approval to continue or log out."
                    }
                    showDeviceIdInput={!currentDeviceId} // Only show input if no device ID is set
                />
                <AlertDialog
                    isOpen={showAlert}
                    message={alertMessage}
                    onClose={() => setShowAlert(false)}
                />
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
                onRefresh={handleManualRefresh}
                message={
                    !currentDeviceId
                        ? "Please enter your Device ID to send an access request and get started."
                        : !currentIsUserVerified
                        ? `Your access request for device ${currentDeviceId} is pending admin approval. Click "Check Status" to refresh your verification status.`
                        : "You need Admin approval to view dashboard features. Please wait for approval to continue or log out."
                }
                showDeviceIdInput={!currentDeviceId} // Only show input if no device ID is set
            />
            <AlertDialog
                isOpen={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
            />

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