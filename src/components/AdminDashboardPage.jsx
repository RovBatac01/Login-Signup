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

  // Get the current user's device ID from localStorage
  const getCurrentUserDeviceId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('🔍 User data from localStorage:', user); // Debug log
      
      // Check both possible property names
      const deviceId = user?.device_id || user?.deviceId;
      console.log('🔍 Device ID found:', deviceId); // Debug log
      
      return deviceId || null;
    } catch (error) {
      console.error('❌ Error parsing user data from localStorage:', error);
      return null;
    }
  };

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    const deviceId = getCurrentUserDeviceId();
    const token = getAuthToken();

    if (!deviceId) {
      console.error('❌ Device ID not found in user data');
      setDashboardSummaryData(prevData => ({
        ...prevData,
        totalUsers: 0,
        totalSensors: 0,
        userError: true,
      }));
      return;
    }

    if (!token) {
      console.error('❌ Authentication token not found');
      return;
    }

    console.log('🔍 Using device ID:', deviceId);

    const fetchTotalUsersByDevice = async () => {
      setDashboardSummaryData(prevData => ({ ...prevData, userError: false }));
      try {
        const response = await fetch(`https://login-signup-3470.onrender.com/api/total-users-by-device/${deviceId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        
        const data = await response.json();
        console.log('✅ Users by device data:', data);
        
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalUsers: data.totalUsers || 0,
          userError: false,
        }));
      } catch (error) {
        console.error("❌ Error fetching total users by device:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalUsers: 0,
          userError: true,
        }));
      }
    };

    const fetchOtherData = async () => {
      // Fetch total establishments (keeping the same as it might be global)
      try {
        const estResponse = await fetch('https://login-signup-3470.onrender.com/api/total-establishments', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!estResponse.ok) {
          const errorData = await estResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${estResponse.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        
        const estData = await estResponse.json();
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalEstablishments: estData.totalEstablishments || 0,
        }));
      } catch (error) {
        console.error("❌ Error fetching total establishments:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalEstablishments: 0,
        }));
      }

      // Fetch total sensors by device ID
      try {
        const sensorResponse = await fetch(`https://login-signup-3470.onrender.com/api/total-sensors-by-device/${deviceId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!sensorResponse.ok) {
          const errorData = await sensorResponse.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(`HTTP error! Status: ${sensorResponse.status}. Message: ${errorData.error || 'Failed to fetch'}`);
        }
        
        const sensorData = await sensorResponse.json();
        console.log('✅ Sensors by device data:', sensorData);
        
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalSensors: sensorData.totalSensors || 0,
        }));
      } catch (error) {
        console.error("❌ Error fetching total sensors by device:", error);
        setDashboardSummaryData(prevData => ({
          ...prevData,
          totalSensors: 0,
        }));
      }
    };

    fetchTotalUsersByDevice();
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