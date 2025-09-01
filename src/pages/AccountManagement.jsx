import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Card } from "react-bootstrap";
import { UserCircle, Shield, Star, UserPlus } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import PageTitle from "../components/PageTitle";
import "../styles/Pages Css/AccountManagement.css";
import AccountTable from "../components/AccountManagementTable";
import "../styles/theme.css";
import { ThemeContext } from "../context/ThemeContext";
import axios from "axios";

// Determine API base URL based on environment
const API_BASE_URL = import.meta.env.PROD 
  ? "https://login-signup-3470.onrender.com" 
  : "http://localhost:5000";

const AccountManagement = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
    recentlyAdded: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch all users for basic stats
        const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
        const accounts = usersResponse.data;
        
        // Fetch total Super Admins from our new endpoint
        const superAdminsResponse = await axios.get(`${API_BASE_URL}/api/total-super-admins`);
        const superAdminCount = superAdminsResponse.data.totalSuperAdmins;
        
        // Calculate other statistics
        const admins = accounts.filter(account => account.role === "Admin").length;
        const regularUsers = accounts.filter(account => account.role === "User").length;
        
        // Get users added in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentUsers = accounts.filter(account => {
          // If there's a created_at field, use it, otherwise count all users
          if (account.created_at) {
            return new Date(account.created_at) > thirtyDaysAgo;
          }
          return false;
        }).length;
        
        setUserStats({
          totalUsers: regularUsers,
          totalAdmins: admins,
          totalSuperAdmins: superAdminCount,
          recentlyAdded: recentUsers || accounts.length // Fallback if no dates available
        });
      } catch (error) {
        console.error("Error fetching user statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, []);

  return (
    <div className={`account ${theme}`}>
      <div className="account-container">
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <div className="account-contents">
          {/* Account Management Title */}
          <PageTitle title="ACCOUNT MANAGEMENT" />
          
          {/* User Statistics Cards */}
          <div className="account-stats-row">
            <Card className={`account-stat-card ${theme}`}>
              <Card.Body>
                <div className="stat-icon-container user-icon">
                  <UserCircle size={24} />
                </div>
                <h2 className="stat-count">{userStats.totalUsers}</h2>
                <p className="stat-title">Regular Users</p>
                <div className="stat-info">
                  Total registered users with standard access
                </div>
              </Card.Body>
            </Card>
            
            <Card className={`account-stat-card ${theme}`}>
              <Card.Body>
                <div className="stat-icon-container admin-icon">
                  <Shield size={24} />
                </div>
                <h2 className="stat-count">{userStats.totalAdmins}</h2>
                <p className="stat-title">Administrators</p>
                <div className="stat-info">
                  Users with administrative privileges
                </div>
              </Card.Body>
            </Card>
            
            <Card className={`account-stat-card ${theme}`}>
              <Card.Body>
                <div className="stat-icon-container super-admin-icon">
                  <Star size={24} />
                </div>
                <h2 className="stat-count">{userStats.totalSuperAdmins}</h2>
                <p className="stat-title">Super Admins</p>
                <div className="stat-info">
                  Users with full system access
                </div>
              </Card.Body>
            </Card>
            
            <Card className={`account-stat-card ${theme}`}>
              <Card.Body>
                <div className="stat-icon-container recent-icon">
                  <UserPlus size={24} />
                </div>
                <h2 className="stat-count">{userStats.recentlyAdded}</h2>
                <p className="stat-title">Recently Added</p>
                <div className="stat-info">
                  New accounts in the last 30 days
                </div>
              </Card.Body>
            </Card>
          </div>
          
          {/* Account management table */}
          <div className="account-management-section">
            <AccountTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountManagement;
