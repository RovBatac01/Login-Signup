import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, UserCheck, CalendarCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Pages Css/Notifications.css';
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../context/ThemeContext';
import PageTitle from "../components/PageTitle";

// --- Helper Functions for User Notifications in localStorage ---
const getUserNotificationsKey = (userId) => `userNotifications_${userId}`;

const loadUserNotifications = (userId) => {
    if (!userId) {
        console.warn("Attempted to load user notifications without a userId.");
        return [];
    }
    try {
        const storedNotifications = localStorage.getItem(getUserNotificationsKey(userId));
        return storedNotifications ? JSON.parse(storedNotifications) : [];
    } catch (error) {
        console.error("Frontend (UserNotif): Failed to parse user notifications from localStorage:", error);
        return [];
    }
};

const saveUserNotifications = (userId, notifications) => {
    if (!userId) {
        console.warn("Attempted to save user notifications without a userId.");
        return;
    }
    try {
        localStorage.setItem(getUserNotificationsKey(userId), JSON.stringify(notifications));
    } catch (error) {
        console.error("Frontend (UserNotif): Failed to save user notifications to localStorage:", error);
    }
};

// --- NotificationIcon component (updated for relevant user types) ---
const NotificationIcon = ({ type }) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="icon-success" />;
        case 'warning':
            return <AlertTriangle className="icon-warning" />;
        case 'error':
            return <XCircle className="icon-error" />;
        case 'info':
            return <Bell className="icon-info" />;
        case 'request':
            return <UserCheck className="icon-info" />;
        case 'new_user':
            return <UserCheck className="icon-info" />;
        case 'schedule': // Added for scheduled events
            return <CalendarCheck className="icon-info" />;
        default:
            return <Bell className="icon-default" />;
    }
};

// --- NotificationCard component ---
const NotificationCard = ({ notification, onMarkAsRead }) => {
    const { theme } = useContext(ThemeContext);

    // Function to format the display type for readability
    const getDisplayType = (type) => {
        switch (type) {
            case 'request': return 'Access Request Status';
            case 'new_user': return 'Account Update';
            case 'schedule': return 'Scheduled Event'; // Display name for events
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
                            {/* Display status only for 'request' type, if applicable for user */}
                            {notification.type === 'request' && notification.status && (
                                <p className={`notification-status status-${notification.status}`}>
                                    Status: {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="notification-actions">
                        {/* Mark as Read button (not for schedules, as they might not have a 'read' state in DB) */}
                        {!notification.read && notification.type !== 'schedule' && (
                            <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`notification-action-button mark-read-button`}
                                title="Mark as Read"
                            >
                                <CheckCircle className="mark-read-icon" />
                            </button>
                        )}

                    </div>
                </div>
                <p className="notification-timestamp">
                    {new Date(notification.createdAt).toLocaleString()}
                </p>
            </div>
        </motion.div>
    );
};

const UserNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useContext(ThemeContext);
    const [userId, setUserId] = useState(null);

    const API_BASE_URL = "https://login-signup-3470.onrender.com";

    // Ref for the latest notifications state, crucial for polling
    const notificationsRef = useRef(notifications);
    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    // Effect to retrieve current user's ID from localStorage
    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const currentUser = JSON.parse(userString);
                setUserId(currentUser.id);
            } catch (e) {
                console.error("Error parsing user from localStorage in UserNotif:", e);
            }
        }
    }, []);

    // --- Function to fetch user-specific notifications and all schedules from the backend ---
    const fetchUserNotifications = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return; // Don't fetch if no userId
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Get user's token
            if (!token) {
                console.warn("No authentication token found for user. Cannot fetch notifications.");
                setNotifications(loadUserNotifications(userId)); // Fallback to localStorage
                setLoading(false);
                return;
            }

            // DEBUGGING LOGS FOR FETCH NOTIFICATIONS
            const fetchUrl = `${API_BASE_URL}/api/user/notifications`;
            console.log(`[FETCH] API_BASE_URL:`, API_BASE_URL);
            console.log(`[FETCH] Full URL:`, fetchUrl);
            console.log(`[FETCH] Token present:`, !!token);

            // Fetch notifications specific to this user ID and all schedules
            const response = await axios.get(fetchUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setNotifications(response.data.notifications);
                saveUserNotifications(userId, response.data.notifications); // Update localStorage cache
                console.log(`Frontend (UserNotif): Notifications and schedules fetched from database for user ${userId}.`);
            } else {
                console.error("Failed to fetch user notifications and schedules:", response.data.message);
                setNotifications(loadUserNotifications(userId)); // Fallback on backend error
            }
        } catch (error) {
            console.error("Error fetching user notifications and schedules from backend:", error.response?.data || error.message);
            setNotifications(loadUserNotifications(userId)); // Fallback on network error
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, userId, loadUserNotifications, saveUserNotifications]); // Dependencies for fetchUserNotifications


    // Effect hook to fetch data on component mount and set up polling
    useEffect(() => {
        if (userId) { // Only run if userId is available
            fetchUserNotifications();
            // Polling for new notifications
            const pollInterval = setInterval(fetchUserNotifications, 5000); // Poll every 5 seconds
            return () => clearInterval(pollInterval); // Cleanup on unmount
        }
    }, [userId, fetchUserNotifications]);


    const markAsRead = async (id) => {
        // If it's a scheduled event (prefixed with 'event_'), it might not have a 'read' status in DB.
        // For now, only mark actual notifications as read in DB.
        if (id.startsWith('event_')) {
            setNotifications(prevNotifications => {
                const updated = prevNotifications.map(n => n.id === id ? { ...n, read: true } : n);
                return updated;
            });
            console.log(`Frontend (UserNotif): Locally marked scheduled event ${id} as read.`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // DEBUGGING LOGS FOR MARK AS READ
            const markReadUrl = `${API_BASE_URL}/api/user/notifications/mark-read`;
            console.log(`[MARK READ] API_BASE_URL:`, API_BASE_URL);
            console.log(`[MARK READ] Notification ID:`, id);
            console.log(`[MARK READ] Full URL:`, markReadUrl);
            console.log(`[MARK READ] Token present:`, !!token);

            const response = await axios.post(markReadUrl,
                { notificationIds: id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(prevNotifications => {
                    const updated = prevNotifications.map(n => n.id === id ? { ...n, read: true } : n);
                    return updated;
                });
                console.log(`Frontend (UserNotif): Marked notification ${id} as read in DB.`);
            } else {
                console.error("Failed to mark as read:", response.data.message);
            }
        } catch (error) {
            console.error("Error marking notification as read:", error.response?.data || error.message);
        }
    };

    const markAllAsRead = async () => {
        const unreadNotificationIds = notifications.filter(n => !n.read && !n.id.startsWith('event_')).map(n => n.id);
        if (unreadNotificationIds.length === 0) {
            // If only schedules or all already read, mark locally
            setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, read: true })));
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // DEBUGGING LOGS FOR MARK ALL AS READ
            const markAllReadUrl = `${API_BASE_URL}/api/user/notifications/mark-read`;
            console.log(`[MARK ALL READ] API_BASE_URL:`, API_BASE_URL);
            console.log(`[MARK ALL READ] IDs to send:`, unreadNotificationIds);
            console.log(`[MARK ALL READ] Full URL:`, markAllReadUrl);
            console.log(`[MARK ALL READ] Token present:`, !!token);

            const response = await axios.post(markAllReadUrl,
                { notificationIds: unreadNotificationIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setNotifications(prevNotifications => prevNotifications.map(n => ({ ...n, read: true })));
                console.log("Frontend (UserNotif): Marked all actual notifications as read in DB.");
            } else {
                console.error("Failed to mark all as read:", response.data.message);
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error.response?.data || error.message);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`notifications-container bg-${theme}-background text-${theme}-text`}>
            <div className="notifications-wrapper">
                <div className="notifications-header">
                    <PageTitle title="Notifications" />
                    <div className="notifications-actions">
                        <button
                            onClick={markAllAsRead}
                            disabled={unreadCount === 0}
                            className="notifications-button mark-all-read-button"
                        >
                            <CheckCircle className="action-icon" />
                            Mark all as read
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className={`loading-text text-${theme}-secondary-text`}>Loading your notifications and schedules...</div>
                ) : notifications.length === 0 ? (
                    <div className={`no-notifications-text text-${theme}-secondary-text italic`}>No notifications or schedules available.</div>
                ) : (
                    <AnimatePresence>
                        {notifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

const UserNotif = () => {
    return (
        <div className="Notifpage">
            <Sidebar />
            <div className="Notifpage-content">
                <UserNotificationsPage />
            </div>
        </div>
    );
};

export default UserNotif;