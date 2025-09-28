import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, UserCheck, Check, X, CalendarCheck, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Pages Css/Notifications.css';
import Sidebar from '../components/Sidebar';
import PageTitle from "../components/PageTitle";
import { ThemeContext } from '../context/ThemeContext';

// --- Helper Functions for User Notifications (kept outside as they might be used elsewhere) ---
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
            return <CalendarCheck className="icon-info" />;
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
                            {notification.type === 'request' && notification.status && (
                                <p className={`notification-status status-${notification.status}`}>
                                    Status: {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="notification-actions">
                        {!notification.read && notification.type !== 'request' && notification.type !== 'schedule' && (
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
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const { theme } = useContext(ThemeContext);

    const API_BASE_URL = "http://localhost:5000";

    // --- Filter Options ---
    const filterOptions = [
        { value: 'all', label: 'All Notifications', count: 0 },
        { value: 'sensor', label: 'Sensor Alerts', count: 0 },
        { value: 'request', label: 'Access Requests', count: 0 },
        { value: 'new_user', label: 'New Users', count: 0 },
        { value: 'schedule', label: 'Scheduled Events', count: 0 },
        { value: 'success', label: 'Success', count: 0 },
        { value: 'warning', label: 'Warnings', count: 0 },
        { value: 'error', label: 'Errors', count: 0 },
        { value: 'info', label: 'Information', count: 0 },
        { value: 'unread', label: 'Unread Only', count: 0 }
    ];

    // --- Helper Functions ---
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

    // --- Filter notifications based on selected filter ---
    const filterNotifications = useCallback((notifications, filter) => {
        switch (filter) {
            case 'all':
                return notifications;
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'sensor':
            case 'request':
            case 'new_user':
            case 'schedule':
            case 'success':
            case 'warning':
            case 'error':
            case 'info':
                return notifications.filter(n => n.type === filter);
            default:
                return notifications;
        }
    }, []);

    // --- Update filter counts ---
    const updateFilterCounts = useCallback((notifications) => {
        return filterOptions.map(option => {
            let count = 0;
            switch (option.value) {
                case 'all':
                    count = notifications.length;
                    break;
                case 'unread':
                    count = notifications.filter(n => !n.read).length;
                    break;
                default:
                    count = notifications.filter(n => n.type === option.value).length;
                    break;
            }
            return { ...option, count };
        });
    }, []);

    // --- Function to fetch notifications and events from the backend ---
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("No authentication token found for admin. Cannot fetch notifications.");
                const localNotifications = loadSuperAdminNotifications();
                setNotifications(localNotifications);
                setFilteredNotifications(filterNotifications(localNotifications, selectedFilter));
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_BASE_URL}/api/admin/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                const fetchedNotifications = response.data.notifications.map(n => ({
                    ...n,
                    type: n.type || 'sensor'
                }));
                setNotifications(fetchedNotifications);
                setFilteredNotifications(filterNotifications(fetchedNotifications, selectedFilter));
                saveSuperAdminNotifications(fetchedNotifications);
                console.log("Frontend (Super Admin): Sensor notifications fetched from database.");
            } else {
                console.error("Failed to fetch sensor notifications:", response.data.message);
                const localNotifications = loadSuperAdminNotifications();
                setNotifications(localNotifications);
                setFilteredNotifications(filterNotifications(localNotifications, selectedFilter));
            }
        } catch (error) {
            console.error("Error fetching sensor notifications from backend:", error);
            const localNotifications = loadSuperAdminNotifications();
            setNotifications(localNotifications);
            setFilteredNotifications(filterNotifications(localNotifications, selectedFilter));
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, loadSuperAdminNotifications, saveSuperAdminNotifications, filterNotifications, selectedFilter]);

    // --- Handle filter change ---
    const handleFilterChange = (filterValue) => {
        setSelectedFilter(filterValue);
        setFilteredNotifications(filterNotifications(notifications, filterValue));
    };

    // Effect hook to fetch data on component mount and set up polling
    useEffect(() => {
        fetchNotifications();
        const pollInterval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(pollInterval);
    }, [fetchNotifications]);

    // Effect hook to update filtered notifications when notifications change
    useEffect(() => {
        setFilteredNotifications(filterNotifications(notifications, selectedFilter));
    }, [notifications, selectedFilter, filterNotifications]);

    // Effect hook to save notifications to localStorage whenever 'notifications' state changes
    useEffect(() => {
        if (!loading) {
            saveSuperAdminNotifications(notifications);
            console.log("Frontend (Super Admin): Notifications saved to localStorage.");
        }
    }, [notifications, loading, saveSuperAdminNotifications]);

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
                setNotifications([]);
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

    const unreadCount = notifications.filter(n => !n.read).length;
    const updatedFilterOptions = updateFilterCounts(notifications);

    return (
        <div className={`notifications-container bg-${theme}-background text-${theme}-text`}>
            <div className="notifications-wrapper">
                <div className="notifications-header">
                    <PageTitle title="NOTIFICATIONS" />
                

                    <div className="notifications-actions">

                                            {/* Filter Dropdown */}
                    <div className="notifications-filter">
                        <div className="filter-dropdown">
                            <Filter className="filter-icon" />
                            <select
                                value={selectedFilter}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className={`filter-select bg-${theme}-background text-${theme}-text border-${theme}`}
                            >
                                {updatedFilterOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label} ({option.count})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
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

                {/* Filter Status */}
                <div className="filter-status">
                    <span className={`text-${theme}-secondary-text`}>
                        {selectedFilter === 'all' 
                            ? `Showing all ${filteredNotifications.length} notifications`
                            : `Showing ${filteredNotifications.length} ${updatedFilterOptions.find(opt => opt.value === selectedFilter)?.label.toLowerCase() || 'notifications'}`
                        }
                    </span>
                </div>

                {loading ? (
                    <div className={`loading-text text-${theme}-secondary-text`}>Loading notifications and events from database...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className={`no-notifications-text text-${theme}-secondary-text italic`}>
                        {selectedFilter === 'all' 
                            ? 'No notifications or events available.'
                            : `No ${updatedFilterOptions.find(opt => opt.value === selectedFilter)?.label.toLowerCase() || 'notifications'} found.`
                        }
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredNotifications.map(notification => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={markAsRead}
                                onDelete={deleteNotification}
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