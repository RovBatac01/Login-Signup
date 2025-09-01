import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, UserCheck, Check, X, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Pages Css/Notifications.css';
import Sidebar from '../components/Sidebar';
import PageTitle from "../components/PageTitle";
import { ThemeContext } from '../context/ThemeContext';

// --- Helper Functions for User Notifications (kept outside as they might be used elsewhere) ---
// If these are *also* only used within NotificationsPage, consider moving them inside as well.
const getUserNotificationsKey = (userId) => `userNotifications_${userId}`;

const loadUserNotifications = (userId) => {
    if (!userId) return [];
    const savedNotifications = localStorage.getItem(getUserNotificationsKey(userId));
    return savedNotifications ? JSON.parse(savedNotifications) : [];
};

const saveUserNotifications = (userId, notifications) => {
    if (userId) {
        localStorage.setItem(getUserNotificationsKey(userId), JSON.stringify(notifications));
    }
};

// --- NotificationIcon component ---
const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'sensor':
            return <AlertTriangle className="icon-warning" />;
        case 'request':
            return <UserCheck className="icon-info" />;
        case 'new_user':
            return <UserCheck className="icon-info" />;
        case 'schedule':
            return <CalendarCheck className="icon-info" />; // Using CalendarCheck icon for scheduled events
        case 'success':
            return <CheckCircle className="icon-success" />;
        case 'warning':
            return <AlertTriangle className="icon-warning" />;
        case 'error':
            return <XCircle className="icon-error" />;
        case 'info':
            return <Bell className="icon-info" />;
        default:
            return <Bell className="icon-default" />;
    }
};

// --- NotificationCard component ---
// Removed onApproveRequest, onDeclineRequest from props
const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
    const { theme } = useContext(ThemeContext);

    // Function to format the display type for readability
    const getDisplayType = (type) => {
        switch (type) {
            case 'request': return 'Access Request';
            case 'new_user': return 'New User';
            case 'sensor': return 'Sensor Alert';
            case 'schedule': return 'Scheduled Event';
            default: return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            <div className={`notification-card ${notification.read ? `read-${theme}` : `unread-${theme}`} border-${theme}`}>
                <div className="notification-content">
                    <div className="notification-info">
                        <div className="notification-icon-wrapper">
                            <NotificationIcon type={notification.type} />
                        </div>
                        <div>
                            <h4 className={`notification-type ${notification.read ? 'read' : 'unread'}`}>
                                {getDisplayType(notification.type)}
                            </h4>
                            <p className={`notification-message ${notification.read ? 'read' : 'unread'}`}>
                                {notification.message}
                            </p>
                            {/* Display status only for 'request' type */}
                            {notification.type === 'request' && notification.status && (
                                <p className={`notification-status status-${notification.status}`}>
                                    Status: {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="notification-actions">
                        {/* Mark as Read button (not for access requests, and optionally not for schedule) */}
                        {!notification.read && notification.type !== 'request' && notification.type !== 'schedule' && (
                            <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`notification-action-button mark-read-button`}
                                title="Mark as Read"
                            >
                                <CheckCircle className="mark-read-icon" />
                            </button>
                        )}

                        {/* Approval/Decline buttons for 'request' type and 'pending' status - REMOVED */}
                        {/* {notification.type === 'request' && notification.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => onApproveRequest(notification.id, notification.fromUserId)}
                                    className={`notification-action-button approve-button`}
                                    title="Approve Request"
                                >
                                    <Check className="approve-request-icon" />
                                </button>
                                <button
                                    onClick={() => onDeclineRequest(notification.id, notification.fromUserId)}
                                    className={`notification-action-button decline-button`}
                                    title="Decline Request"
                                >
                                    <X className="decline-request-icon" />
                                </button>
                            </>
                        )} */}

                        <button
                            onClick={() => onDelete(notification.id)}
                            className={`notification-action-button delete-button`}
                            title="Delete Notification"
                        >
                            <Trash2 className="delete-icon" />
                        </button>
                    </div>
                </div>
                <p className="notification-timestamp">
                    {new Date(notification.createdAt).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

// --- NotificationsPage (Super Admin's Main Component) ---
const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useContext(ThemeContext);

    const API_BASE_URL = "https://login-signup-3470.onrender.com"; // Ensure this matches your backend URL

    // --- Helper Functions for Super Admin Notifications (MOVED INSIDE COMPONENT) ---
    // Wrapped with useCallback to ensure stable function references for dependency arrays.
    const loadSuperAdminNotifications = useCallback(() => {
        try {
            const storedNotifications = localStorage.getItem('superAdminNotifications');
            return storedNotifications ? JSON.parse(storedNotifications) : [];
        } catch (error) {
            console.error("Frontend: Failed to parse Super Admin notifications from localStorage:", error);
            return [];
        }
    }, []);

    const saveSuperAdminNotifications = useCallback((notificationsToSave) => {
        try {
            localStorage.setItem('superAdminNotifications', JSON.stringify(notificationsToSave));
        } catch (error) {
            console.error("Frontend: Failed to save Super Admin notifications to localStorage:", error);
        }
    }, []);

    // --- Function to fetch notifications and events from the backend ---
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Get admin's token
            if (!token) {
                console.warn("No authentication token found for admin. Cannot fetch notifications.");
                setNotifications(loadSuperAdminNotifications()); // Fallback to localStorage
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/admin/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                // Ensure 'type' is 'sensor' for these notifications as per backend endpoint
                const fetchedNotifications = response.data.notifications.map(n => ({
                    ...n,
                    type: n.type || 'sensor' // Default to 'sensor' if not explicitly set by backend for some reason
                }));
                setNotifications(fetchedNotifications);
                saveSuperAdminNotifications(fetchedNotifications); // Update localStorage cache
                console.log("Frontend (Super Admin): Sensor notifications fetched from database.");
            } else {
                console.error("Failed to fetch sensor notifications:", response.data.message);
                setNotifications(loadSuperAdminNotifications()); // Fallback on backend error
            }
        } catch (error) {
            console.error("Error fetching sensor notifications from backend:", error);
            setNotifications(loadSuperAdminNotifications()); // Fallback on network error
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, loadSuperAdminNotifications, saveSuperAdminNotifications]); // Dependencies for fetchNotifications

    // Effect hook to fetch data on component mount and set up polling
    useEffect(() => {
        fetchNotifications();
        const pollInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(pollInterval); // Cleanup on unmount
    }, [fetchNotifications]); // Re-run if fetchNotifications changes (controlled by useCallback)

    // Effect hook to save notifications to localStorage whenever 'notifications' state changes
    useEffect(() => {
        if (!loading) { // Only save once loading is complete
            saveSuperAdminNotifications(notifications);
            console.log("Frontend (Super Admin): Notifications saved to localStorage.");
        }
    }, [notifications, loading, saveSuperAdminNotifications]); // Dependencies for saving

    // --- Backend API calls for sensor notifications ---

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            const response = await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-read`, { notificationId: id }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(prevNotifications => {
                    // Update the status locally for immediate UI feedback
                    const updated = prevNotifications.map(n =>
                        n.id === id ? { ...n, read: true, status: 'read' } : n
                    );
                    console.log("Frontend (Super Admin): Marked notification as read (via API):", id);
                    return updated;
                });
            } else {
                console.error("Failed to mark notification as read:", response.data.message);
                alert(`Failed to mark notification as read: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
            alert("An error occurred while marking notification as read.");
        }
    };

    const deleteNotification = async (id) => {
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            const response = await axios.delete(`${API_BASE_URL}/api/admin/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(prevNotifications => {
                    // Remove the notification locally for immediate UI feedback
                    const updated = prevNotifications.filter(n => n.id !== id);
                    console.log("Frontend (Super Admin): Deleted notification (via API):", id);
                    return updated;
                });
            } else {
                console.error("Failed to delete notification:", response.data.message);
                alert(`Failed to delete notification: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
            alert("An error occurred while deleting notification.");
        }
    };

    const markAllAsRead = async () => {
        if (!window.confirm('Are you sure you want to mark ALL unread sensor notifications as read?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            const response = await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-all-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications(prevNotifications => {
                    // Mark all relevant notifications as read locally
                    const updated = prevNotifications.map(n => ({ ...n, read: true, status: 'read' }));
                    console.log("Frontend (Super Admin): Marked all notifications as read (via API).");
                    return updated;
                });
            } else {
                console.error("Failed to mark all notifications as read:", response.data.message);
                alert(`Failed to mark all notifications as read: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            alert("An error occurred while marking all notifications as read.");
        }
    };

    const deleteAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete ALL sensor notifications? This action cannot be undone.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication token not found. Please log in again.");
                return;
            }
            const response = await axios.delete(`${API_BASE_URL}/api/admin/notifications/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setNotifications([]); // Clear all notifications locally
                console.log("Frontend (Super Admin): Deleted all notifications (via API).");
            } else {
                console.error("Failed to delete all notifications:", response.data.message);
                alert(`Failed to delete all notifications: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error deleting all notifications:", error);
            alert("An error occurred while deleting all notifications.");
        }
    };

    // Removed handleApproveRequest and handleDeclineRequest functions
    // const handleApproveRequest = async (notificationId, userId) => { ... };
    // const handleDeclineRequest = async (notificationId, userId) => { ... };


    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`notifications-container bg-${theme}-background text-${theme}-text`}>
            <div className="notifications-wrapper">
                <div className="notifications-header">
                    <PageTitle title="NOTIFICATIONS" />
                    <div className="notifications-actions">
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="notifications-button mark-all-read-button"
                        >
                            <CheckCircle className="action-icon" />
                            Mark all as read
                        </button>
                        <button
                            onClick={deleteAllNotifications}
                            disabled={notifications.length === 0}
                            className="notifications-button delete-all-button"
                        >
                            <Trash2 className="action-icon" />
                            Delete all
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className={`loading-text text-${theme}-secondary-text`}>Loading notifications and events from database...</div>
                ) : notifications.length === 0 ? (
                    <div className={`no-notifications-text text-${theme}-secondary-text italic`}>No notifications or events available.</div>
                ) : (
                    <AnimatePresence>
                        {notifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                                // Removed onApproveRequest and onDeclineRequest props
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

const Notifications = () => {
    return (
        <div className="Notifpage">
            <Sidebar />
            <div className="Notifpage-content">
                <NotificationsPage />
            </div>
        </div>
    );
};

export default Notifications;