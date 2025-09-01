import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, CalendarCheck, UserCheck, UserX } from 'lucide-react'; // Import new icons
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Pages Css/Notifications.css';
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../context/ThemeContext';
import PageTitle from "../components/PageTitle";

// --- NotificationIcon component (updated for 'schedule' and 'request' type) ---
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
        case 'schedule':
            return <CalendarCheck className="icon-info" />;
        case 'request': // New case for access requests
            return <Bell className="icon-request" />; // Or a specific icon like UserCheck for pending
        default:
            return <Bell className="icon-default" />;
    }
};

// --- NotificationCard component (updated for 'schedule' and 'request' type display) ---
const NotificationCard = ({ notification, onMarkAsRead, onDelete, onApprove, onDecline }) => { // Add onApprove, onDecline
    const { theme } = useContext(ThemeContext);

    const getDisplayType = (type) => {
        switch (type) {
            case 'schedule': return 'Scheduled Event';
            case 'request': return 'Access Request'; // Display name for access requests
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    // Determine if the notification is a pending access request
    const isPendingRequest = notification.type === 'request' && notification.status === 'pending';

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
                            {/* Display status for requests if not pending */}
                            {notification.type === 'request' && notification.status !== 'pending' && (
                                <p className={`notification-status status-${notification.status}`}>
                                    Status: {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="notification-actions">
                        {isPendingRequest && (
                            <>
                                <button
                                    onClick={() => onApprove(notification.id, notification.user_id)} // Pass notif ID and user ID
                                    className={`notification-action-button approve-button`}
                                    title="Approve Request"
                                >
                                    <UserCheck className="approve-icon" /> Approve
                                </button>
                                <button
                                    onClick={() => onDecline(notification.id, notification.user_id)} // Pass notif ID and user ID
                                    className={`notification-action-button decline-button`}
                                    title="Decline Request"
                                >
                                    <UserX className="decline-icon" /> Decline
                                </button>
                            </>
                        )}

                        {/* Optionally hide mark as read for schedules/requests if they are more like fixed calendar entries/actions */}
                        {!notification.read && notification.type !== 'schedule' && notification.type !== 'request' && (
                            <button
                                onClick={() => onMarkAsRead(notification.id)}
                                className={`notification-action-button mark-read-button`}
                                title="Mark as Read"
                            >
                                <CheckCircle className="mark-read-icon" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(notification.id)}
                            className={`notification-action-button delete-button`}
                            title="Delete"
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


const AdminNotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { theme } = useContext(ThemeContext);

    const API_BASE_URL = "https://login-signup-3470.onrender.com";

    // --- CHANGE 1: Use a more general localStorage key for all admin notifications ---
    const loadAdminNotifications = useCallback(() => {
        try {
            const storedNotifications = localStorage.getItem('adminNotifications'); // Changed key
            return storedNotifications ? JSON.parse(storedNotifications) : [];
        } catch (error) {
            console.error("Frontend: Failed to parse Admin notifications from localStorage:", error);
            return [];
        }
    }, []);

    const saveAdminNotifications = useCallback((notificationsToSave) => {
        try {
            localStorage.setItem('adminNotifications', JSON.stringify(notificationsToSave)); // Changed key
        } catch (error) {
            console.error("Frontend: Failed to save Admin notifications to localStorage:", error);
        }
    }, []);


    // --- CHANGE 2: fetchAllNotifications function to get ALL notification types from backend ---
    const fetchAllNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("No authentication token found for admin. Cannot fetch notifications.");
                setNotifications(loadAdminNotifications());
                setLoading(false);
                return;
            }

            // Fetch ALL notifications for the admin
            const response = await axios.get(`${API_BASE_URL}/api/admin/notifications`, { // Removed type filter
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setNotifications(response.data.notifications);
                saveAdminNotifications(response.data.notifications); // Save fetched notifications
                console.log("Frontend (Admin): All notifications fetched from database.");
            } else {
                console.error("Failed to fetch all notifications:", response.data.message);
                setNotifications(loadAdminNotifications()); // Fallback to localStorage
            }
        } catch (error) {
            console.error("Error fetching notifications from backend:", error);
            setNotifications(loadAdminNotifications()); // Fallback to localStorage
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, loadAdminNotifications, saveAdminNotifications]);

    // Effect hook to fetch data on component mount and set up polling
    useEffect(() => {
        fetchAllNotifications(); // Call the new fetch function
        const pollInterval = setInterval(fetchAllNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(pollInterval); // Cleanup on unmount
    }, [fetchAllNotifications]);

    // Effect hook to save notifications to localStorage whenever 'notifications' state changes
    useEffect(() => {
        if (!loading) {
            saveAdminNotifications(notifications);
            console.log("Frontend (Admin): Notifications saved to localStorage.");
        }
    }, [notifications, loading, saveAdminNotifications]);

    // --- NEW: Handle Approve Request ---
    const handleApproveRequest = async (notificationId, userId) => {
        console.log(`Approving request ${notificationId} for user ${userId}`);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required to approve requests.");
                return;
            }

            const response = await axios.put(`${API_BASE_URL}/api/admin/access-requests/${notificationId}/approve`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                alert(response.data.message);
                fetchAllNotifications(); // Re-fetch all notifications to update status
            } else {
                alert(`Failed to approve request: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error approving request:", error.response?.data || error.message);
            alert(`Error approving request: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    // --- NEW: Handle Decline Request ---
    const handleDeclineRequest = async (notificationId, userId) => {
        console.log(`Declining request ${notificationId} for user ${userId}`);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required to decline requests.");
                return;
            }

            const response = await axios.put(`${API_BASE_URL}/api/admin/access-requests/${notificationId}/decline`, { userId }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                alert(response.data.message);
                fetchAllNotifications(); // Re-fetch all notifications to update status
            } else {
                alert(`Failed to decline request: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error declining request:", error.response?.data || error.message);
            alert(`Error declining request: ${error.response?.data?.message || 'Server error.'}`);
        }
    };


    // Handler functions (simplified as mark as read/delete behavior for schedules might be different)
const markAsRead = async (id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn("No token found for marking notification as read.");
            return;
        }
        // *** FIX HERE: Change from PUT to POST and send ID in body ***
        await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-read`, { notificationId: id }, { // Correct URL and method
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log(`Notification ${id} marked as read in DB.`);
        setNotifications(prevNotifications =>
            prevNotifications.map(n => n.id === id ? { ...n, read: true } : n)
        );
    } catch (error) {
        console.error("Error marking notification as read:", error.response?.data || error.message);
        alert(`Failed to mark notification as read: ${error.response?.data?.message || 'Server error.'}`);
    }
};

const deleteNotification = async (id) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Authentication required to delete notifications.");
            return;
        }
        await axios.delete(`${API_BASE_URL}/api/admin/notifications/${id}`, { // Correct URL
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        console.log(`Notification ${id} deleted from DB.`);
        fetchAllNotifications(); // Re-fetch to ensure the list is up-to-date
    } catch (error) {
        console.error(`Error deleting notification ${id}:`, error.response?.data || error.message);
        alert(`Failed to delete notification: ${error.response?.data?.message || 'Server error.'}`);
    }
};


const markAllAsRead = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert("Authentication required to mark all notifications as read.");
            return;
        }
        // *** FIX HERE: Change from PUT to POST ***
        await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-all-read`, {}, { // Correct method
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        alert("All notifications marked as read!");
        fetchAllNotifications(); // Re-fetch to update local state
    } catch (error) {
        console.error("Error marking all notifications as read:", error.response?.data || error.message);
        alert(`Failed to mark all as read: ${error.response?.data?.message || 'Server error.'}`);
    }
};

    const deleteAllNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required to delete all notifications.");
                return;
            }
            await axios.delete(`${API_BASE_URL}/api/admin/notifications/delete-all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("All notifications deleted!");
            setNotifications([]); // Clear locally immediately
        } catch (error) {
            console.error("Error deleting all notifications:", error.response?.data || error.message);
            alert(`Failed to delete all notifications: ${error.response?.data?.message || 'Server error.'}`);
        }
    };


    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`notifications-container bg-${theme}-background text-${theme}-text`}>
            <div className="notifications-wrapper">
                <div className="notifications-header">
                    {/* CHANGE 3: Generalize the title */}
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
                    <div className={`loading-text text-${theme}-secondary-text`}>Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className={`no-notifications-text text-${theme}-secondary-text italic`}>No notifications available.</div>
                ) : (
                    <AnimatePresence>
                        {notifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
                                onApprove={handleApproveRequest} // Pass the new handler
                                onDecline={handleDeclineRequest} // Pass the new handler
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

const AdminNotif = () => {
    const { theme, toggleTheme } = useContext(ThemeContext); // Added toggleTheme for sidebar
    return (
        <div className="Notifpage">
            <Sidebar theme={theme} toggleTheme={toggleTheme} /> {/* Pass theme and toggleTheme to Sidebar */}
            <div className="Notifpage-content">
                <AdminNotificationsPage />
            </div>
        </div>
    );
};

export default AdminNotif;