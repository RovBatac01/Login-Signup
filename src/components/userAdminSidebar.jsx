import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaTint, FaCogs, FaHistory, FaPowerOff, FaSun, FaMoon } from "react-icons/fa";
import "../styles/Sidebar.css";

const Sidebar = ({ toggleTheme, theme }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={`sidebar ${theme}`}>
      <div className="menu">
        <div className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`} onClick={() => navigate("/dashboard")}>
          <FaHome className="icon" />
          <span>Dashboard</span>
        </div>

        <div className={`menu-item ${location.pathname === "/history" ? "active" : ""}`} onClick={() => navigate("/history")}>
          <FaHistory className="icon" />
          <span>History</span>
        </div>

        {/* Light Mode Toggle */}
        <div className="menu-item theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? <FaSun className="icon" /> : <FaMoon className="icon" />}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </div>
      </div>

      <div className="logout">
        <div className="menu-item" onClick={() => navigate("/")}>
          <FaPowerOff className="icon" />
          <span>Log out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
