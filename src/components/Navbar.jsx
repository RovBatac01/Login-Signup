import React, { useState, useEffect, useContext } from "react";
import { FaBell } from "react-icons/fa";
import "../styles/Components Css/Navbar.css";
import axios from "axios";
import { ThemeContext } from "../context/ThemeContext";

const Navbar = () => {
  const { theme } = useContext(ThemeContext);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // For optimized unread count
  const userRole = localStorage.getItem("userRole"); // Get user role from local storage
  const userUsername = localStorage.getItem("userUsername");
  const [username, setUsername] = useState("");
  const token = localStorage.getItem("authToken"); // Assuming you store the token after login

  // Fetch unread notifications from the database
  const fetchUnreadNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const response = await axios.get(
        `${backendURL}/api/notifications/unread`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Set notifications as unread from the database
      setNotifications(response.data);
      setUnreadCount(response.data.filter((notif) => !notif.read).length); // Update unread count
    } catch (err) {
      console.error(
        "❌ Error fetching notifications:",
        err.response ? err.response.data : err.message
      );
    }
  };

  // Fetch unread notifications when component mounts
  useEffect(() => {
    fetchUnreadNotifications(); // Initial fetch
    const interval = setInterval(fetchUnreadNotifications, 5000); // Fetch every 5 seconds

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Handle showing the modal when clicking the bell icon
  const handleNotificationClick = () => {
    setShowModal(true);
    // Mark all notifications as read
    setNotifications((prevNotifications) =>
      prevNotifications.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0); // Reset unread count
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Frontend: Data received from /api/auth/user:", data); // <--- ADD THIS
          setUsername(data.username);
          console.log("Frontend: Username state updated to:", username); // <--- ADD THIS
        } else {
          console.error("Frontend: Failed to fetch user data", response.status);
        }
      } catch (error) {
        console.error("Frontend: Error fetching user data:", error);
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token]);

  return (
    <div className={`navbar ${theme}`}>
      <div className="left-section">
        <div className="account-info">
          <div className="account-details">
            <h1>Welcome, {username}!</h1>
            <h2>{userRole}</h2>
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="notification-wrapper">
          <FaBell
            className="notification-icon"
            onClick={handleNotificationClick}
          />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
      </div>

      {/* Modal to show notifications */}
      {showModal && (
        <div
          className="notif-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div className="notif-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🔔 Notifications</h3>
            <ul>
              {notifications.length > 0 ? (
                notifications.map((notif, index) => (
                  <li key={index}>
                    <p>{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <li>No notifications yet 📭</li>
              )}
            </ul>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
