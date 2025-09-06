import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Trash2, CalendarCheck, UserCheck, UserX, Filter } from 'lucide-react'; // Added Filter icon
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import '../styles/Pages Css/Notifications.css';
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../context/ThemeContext';
import PageTitle from "../components/PageTitle";

// --- NotificationIcon component (updated for 'schedule' and 'request' type) ---
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

// --- NotificationCard component (updated for 'schedule' and 'request' type display) ---
const NotificationCard = ({ notification, onMarkAsRead, onDelete, onApprove, onDecline }) => {
    const { theme } = useContext(ThemeContext);

    const getDisplayType = (type) => {
        switch (type) {
            case 'request': return 'Access Request';
            case 'new_user': return 'New User';
            case 'sensor': return 'Sensor Alert';
            case 'schedule': return 'Scheduled Event';
            default: return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
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
                                    onClick={() => onApprove(notification.id, notification.user_id)}
                                    className={`notification-action-button approve-button`}
                                    title="Approve Request"
                                >
                                    <UserCheck className="approve-icon" /> Approve
                                </button>
                                <button
                                    onClick={() => onDecline(notification.id, notification.user_id)}
                                    className={`notification-action-button decline-button`}
                                    title="Decline Request"
                                >
                                    <UserX className="decline-icon" /> Decline
                                </button>
                            </>
                        )}

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
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const { theme } = useContext(ThemeContext);

    const API_BASE_URL = "https://login-signup-3470.onrender.com";

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
        { value: 'unread', label: 'Unread Only', count: 0 },
        { value: 'pending', label: 'Pending Requests', count: 0 }
    ];

    const loadAdminNotifications = useCallback(() => {
        try {
            const storedNotifications = localStorage.getItem('adminNotifications');
            return storedNotifications ? JSON.parse(storedNotifications) : [];
        } catch (error) {
            console.error("Frontend: Failed to parse Admin notifications from localStorage:", error);
            return [];
        }
    }, []);

    const saveAdminNotifications = useCallback((notificationsToSave) => {
        try {
            localStorage.setItem('adminNotifications', JSON.stringify(notificationsToSave));
        } catch (error) {
            console.error("Frontend: Failed to save Admin notifications to localStorage:", error);
        }
    }, []);

    // --- Filter notifications based on selected filter ---
    const filterNotifications = useCallback((notifications, filter) => {
        switch (filter) {
            case 'all':
                return notifications;
            case 'unread':
                return notifications.filter(n => !n.read);
            case 'pending':
                return notifications.filter(n => n.type === 'request' && n.status === 'pending');
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
                case 'pending':
                    count = notifications.filter(n => n.type === 'request' && n.status === 'pending').length;
                    break;
                default:
                    count = notifications.filter(n => n.type === option.value).length;
                    break;
            }
            return { ...option, count };
        });
    }, []);

    // --- Handle filter change ---
    const handleFilterChange = (filterValue) => {
        setSelectedFilter(filterValue);
        setFilteredNotifications(filterNotifications(notifications, filterValue));
    };

    const fetchAllNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("No authentication token found for admin. Cannot fetch notifications.");
                const localNotifications = loadAdminNotifications();
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
                    type: n.type || 'info'
                }));
                setNotifications(fetchedNotifications);
                setFilteredNotifications(filterNotifications(fetchedNotifications, selectedFilter));
                saveAdminNotifications(fetchedNotifications);
                console.log("Frontend (Admin): All notifications fetched from database.");
            } else {
                console.error("Failed to fetch all notifications:", response.data.message);
                const localNotifications = loadAdminNotifications();
                setNotifications(localNotifications);
                setFilteredNotifications(filterNotifications(localNotifications, selectedFilter));
            }
        } catch (error) {
            console.error("Error fetching notifications from backend:", error);
            const localNotifications = loadAdminNotifications();
            setNotifications(localNotifications);
            setFilteredNotifications(filterNotifications(localNotifications, selectedFilter));
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, loadAdminNotifications, saveAdminNotifications, filterNotifications, selectedFilter]);

    // Effect hook to fetch data on component mount and set up polling
    useEffect(() => {
        fetchAllNotifications();
        const pollInterval = setInterval(fetchAllNotifications, 30000);
        return () => clearInterval(pollInterval);
    }, [fetchAllNotifications]);

    // Effect hook to update filtered notifications when notifications change
    useEffect(() => {
        setFilteredNotifications(filterNotifications(notifications, selectedFilter));
    }, [notifications, selectedFilter, filterNotifications]);

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
                fetchAllNotifications();
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
                fetchAllNotifications();
            } else {
                alert(`Failed to decline request: ${response.data.message}`);
            }
        } catch (error) {
            console.error("Error declining request:", error.response?.data || error.message);
            alert(`Error declining request: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("No token found for marking notification as read.");
                return;
            }
            await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-read`, { notificationId: id }, {
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
        if (!window.confirm('Are you sure you want to delete this notification?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required to delete notifications.");
                return;
            }
            await axios.delete(`${API_BASE_URL}/api/admin/notifications/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            console.log(`Notification ${id} deleted from DB.`);
            fetchAllNotifications();
        } catch (error) {
            console.error(`Error deleting notification ${id}:`, error.response?.data || error.message);
            alert(`Failed to delete notification: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    const markAllAsRead = async () => {
        if (!window.confirm('Are you sure you want to mark ALL unread notifications as read?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Authentication required to mark all notifications as read.");
                return;
            }
            await axios.post(`${API_BASE_URL}/api/admin/notifications/mark-all-read`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("All notifications marked as read!");
            fetchAllNotifications();
        } catch (error) {
            console.error("Error marking all notifications as read:", error.response?.data || error.message);
            alert(`Failed to mark all as read: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    const deleteAllNotifications = async () => {
        if (!window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.')) {
            return;
        }
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
            setNotifications([]);
        } catch (error) {
            console.error("Error deleting all notifications:", error.response?.data || error.message);
            alert(`Failed to delete all notifications: ${error.response?.data?.message || 'Server error.'}`);
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
                    <div className={`loading-text text-${theme}-secondary-text`}>Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                    <div className={`no-notifications-text text-${theme}-secondary-text italic`}>
                        {selectedFilter === 'all' 
                            ? 'No notifications available.'
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
                                onApprove={handleApproveRequest}
                                onDecline={handleDeclineRequest}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

const AdminNotif = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    return (
        <div className="Notifpage">
            <Sidebar theme={theme} toggleTheme={toggleTheme} />
            <div className="Notifpage-content">
                <AdminNotificationsPage />
            </div>
        </div>
    );
};

export default AdminNotif;