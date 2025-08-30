import React, { useState, useContext, useEffect } from 'react';
import { Search, Building, Wifi, Users } from 'lucide-react';
import '../styles/Components Css/DashboardPage.css';
import { ThemeContext } from '../context/ThemeContext'; // adjust path as needed
import PageTitle from "../components/PageTitle";

// DashboardSearch Component
const AdminDashboardSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useContext(ThemeContext); // Theme context is available but not directly used in styling here as it's handled by CSS variables

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
};

// DashboardSummary Component
const AdminDashboardSummary = ({ totalEstablishments, totalSensors, totalUsers }) => {
  const { theme } = useContext(ThemeContext); // Theme context is available

  return (
    <div className="dashboard-summary-container">
      {/* Total Sensors Card */}
      <div className="dashboard-summary-card">
        <div className="dashboard-summary-header">
          <Wifi className="dashboard-summary-icon green" /> {/* Icon for Sensors */}
          <h2 className="dashboard-summary-title">Total Sensors</h2>
        </div>
        <div className="dashboard-summary-content">
          <p className="dashboard-summary-value-green">{totalSensors}</p>
        </div>
      </div>

      {/* Total Users Card */}
      <div className="dashboard-summary-card">
        <div className="dashboard-summary-header">
          <Users className="dashboard-summary-icon purple" /> {/* Icon for Users */}
          <h2 className="dashboard-summary-title">Total Users</h2>
        </div>
        <div className="dashboard-summary-content">
          <p className="dashboard-summary-value-purple">
            {totalUsers !== null ? totalUsers : 'Loading...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// DashboardPage Component
const AdminDashboardPage = () => {
  const [dashboardSummaryData, setDashboardSummaryData] = useState({
    totalEstablishments: 0,
    totalSensors: 0,
    totalUsers: null,
  });

  useEffect(() => {
    const fetchTotalUsers = async () => {
      setDashboardSummaryData(prevData => ({ ...prevData, userError: false }));
      try {
        const response = await fetch('https://login-signup-3470.onrender.com/api/total-users');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        const data = await response.json();
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalUsers: data.totalUsers,
          userError: false,
        }));
      } catch (error) {
        console.error("Error fetching total users:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalUsers: null,
          userError: true,
        }));
      }
    };

    const fetchOtherData = async () => {
      // Fetch total establishments
      try {
        const estResponse = await fetch('https://login-signup-3470.onrender.com/api/total-establishments');
        if (!estResponse.ok) {
          const errorData = await estResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${estResponse.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        const estData = await estResponse.json();
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalEstablishments: estData.totalEstablishments,
        }));
      } catch (error) {
        console.error("Error fetching total establishments:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalEstablishments: 0,
        }));
      }

      // Fetch total sensors
      try {
        const sensorResponse = await fetch('https://login-signup-3470.onrender.com/api/total-sensors');
        if (!sensorResponse.ok) {
          const errorData = await sensorResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${sensorResponse.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        const sensorData = await sensorResponse.json();
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalSensors: sensorData.totalSensors,
        }));
      } catch (error) {
        console.error("Error fetching total sensors:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalSensors: 0,
        }));
      }
    };

    fetchTotalUsers();
    fetchOtherData();
  }, []);

  return (
    <div className="dashboard-page" style={{ width: '100%' }}>
      <PageTitle title="DASHBOARD" />
      <AdminDashboardSearch />
      <AdminDashboardSummary
        totalSensors={dashboardSummaryData.totalSensors}
        totalUsers={dashboardSummaryData.totalUsers}
      />
    </div>
  );
};

export default AdminDashboardPage;