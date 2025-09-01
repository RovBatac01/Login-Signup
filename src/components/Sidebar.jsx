import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaCogs,
  FaHistory,
  FaPowerOff,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { ThemeContext } from "../context/ThemeContext"; // Import ThemeContext
import "../styles/Components Css/Sidebar.css";
import "../styles/theme.css";
import { FaBell, FaGears } from "react-icons/fa6";

const Sidebar = () => {
  console.log("Sidebar component has rendered!");
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext); // Use theme context
  const userRole = localStorage.getItem("userRole"); // Get user role from local storage
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [username, setUsername] = useState("");

  useEffect(() => {
    console.log("Sidebar: Token in useEffect:", token);
    let isMounted = true; // Add a flag to prevent setting state on unmounted components

    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Frontend: Data received from /api/auth/user:", data);
          if (isMounted && data && data.username) {
            // Check if component is mounted and data/username exist
            setUsername(data.username);
            console.log("Frontend: Username state updated to:", data.username);
          } else if (!data?.username) {
            console.warn("Frontend: Username not found in fetched data.");
          }
        } else {
          console.error("Frontend: Failed to fetch user data", response.status);
          // Optionally handle error states here (e.g., set username to "Guest")
        }
      } catch (error) {
        console.error("Frontend: Error fetching user data:", error);
        // Optionally handle error states here
      }
    };

    if (token) {
      fetchUserData();
    } else {
      console.log("Sidebar: No token available.");
      setUsername(""); // Reset username if no token
    }

    return () => {
      isMounted = false; // Cleanup function to set the flag when the component unmounts
    };
  }, [token]);

  // --- Logout Function ---
  const handleLogout = async () => {
    try {
      // 1. Clear token from local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole"); // Clear user role as well
      localStorage.removeItem("user");
      localStorage.removeItem("showAccessModalOnLoad");

      // 2. Reset component state
      setToken(null);
      setUsername("");

      // 3. Navigate to login page or home page
      navigate("/");
      console.log("User logged out successfully.");
    } catch (error) {
      console.error("Error during logout:", error);
      // Even if logout fails on the server, we should still clear client-side token
      localStorage.valueOf("authToken");
      localStorage.removeItem("userRole");
      setToken(null);
      setUsername("");
      navigate("/");
    }
  };

  // --- Helper function to get the correct dashboard path ---
  const getDashboardPath = () => {
    if (userRole === "User") {
      return "/userDB";
    } else if (userRole === "Admin") {
      return "/adminDB";
    } else if (userRole === "Super Admin") {
      return "/dashboard";
    }
    return "/"; // Default or fallback
  };

  // --- Helper function to get the correct notifications path ---
  const getNotificationsPath = () => {
    if (userRole === "User") {
      return "/usernotif";
    } else if (userRole === "Admin") {
      return "/adminnotif";
    } else if (userRole === "Super Admin") {
      return "/notifications";
    }
    return "/"; // Default or fallback
  };

  // --- Function for allowed role in settings ---
  const handleSettingsNavigation = () => {
    if (userRole === "Super Admin" || userRole === "Admin") {
      navigate("/settings");
    } else if (userRole === "User") {
      navigate("/user-settings");
    }
  };

  // --- Determine active path for Settings link ---
  const getSettingsActivePath = () => {
    if (userRole === "Super Admin" || userRole === "Admin") {
      return "/settings";
    } else if (userRole === "User") {
      return "/user-settings";
    }
    return ""; // No active path if role is not recognized
  };

  // --- Helper function to get the correct history path based on role ---
  const getHistoryPath = () => {
    if (userRole === "Super Admin") {
      return "/history"; // Super Admin goes to /history
    } else if (userRole === "Admin") {
      return "/adminhistory"; // Admin goes to /admin-history
    } else if (userRole === "User") {
      return "/user-history"; // User goes to /user-history
    }
    return "/"; // Default or fallback
  };


  const currentDashboardPath = getDashboardPath();
  const currentNotificationsPath = getNotificationsPath();
  const activeSettingsPath = getSettingsActivePath();
  const currentHistoryPath = getHistoryPath(); // Get the history path

  return (
    <div className={`sidebar ${theme}`}>
      <div className="menu">
        <div className="User">
          <h2>Welcome! </h2>
          <h4>{userRole}</h4> {/* Displaying the user's role */}
        </div>

        {/* Dashboard (Dynamic based on role) */}
        <div
          className={`menu-item ${
            location.pathname === currentDashboardPath ? "active" : ""
          }`}
          onClick={() => navigate(currentDashboardPath)}
        >
          <FaHome className="icon" />
          <span>Dashboard</span>
        </div>

        {/* Account Management (Only for Super Admin) */}
        {userRole === "Super Admin" && (
          <div
            className={`menu-item ${
              location.pathname === "/accountmanagement" ? "active" : ""
            }`}
            onClick={() => navigate("/accountmanagement")}
          >
            <FaCogs className="icon" />
            <span>Management</span>
          </div>
        )}

        {/* History (Visible to all roles, but path is dynamic) */}
        <div
          className={`menu-item ${
            location.pathname === currentHistoryPath ? "active" : ""
          }`}
          onClick={() => navigate(currentHistoryPath)}
        >
          <FaHistory className="icon" />
          <span>History</span>
        </div>

        {/* Notifications (Dynamic based on role) */}
        <div
          className={`menu-item ${
            location.pathname === currentNotificationsPath ? "active" : ""
          }`}
          onClick={() => navigate(currentNotificationsPath)}
        >
          <FaBell className="icon" />
          <span>Notifications</span>
        </div>

        {/* Settings (Dynamic based on role) */}
        <div
          className={`menu-item ${
            location.pathname === activeSettingsPath ? "active" : ""
          }`}
          onClick={handleSettingsNavigation} 
        >
          <FaGears className="icon" />
          <span>Settings</span>
        </div>

        {/* Theme Toggle
        <div className="menu-item theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? (
            <FaSun className="icon" />
          ) : (
            <FaMoon className="icon" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </div> */}
      </div>

      {/* Logout */}
      <div className="logout">
        <div className="menu-item" onClick={handleLogout}>
          <FaPowerOff className="icon" />
          <span>Log out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
