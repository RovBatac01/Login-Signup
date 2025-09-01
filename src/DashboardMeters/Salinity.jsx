import React, { useState, useEffect, useContext } from "react";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { ThemeContext } from "../context/ThemeContext";
import socket from "./socket";
import { Activity, WifiOff, Wifi } from "lucide-react"; // Import icons

const Salinity = () => {
  const { theme } = useContext(ThemeContext);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [salinity, setSalinity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleSalinityData = (newData) => {
      console.log("🔄 New Salinity Data:", newData);
      setIsAnimating(true);
      setSalinity(newData.value);
      setTimeout(() => setIsAnimating(false), 800); // Animation duration
    };

    // Fetch latest salinity value on mount (fallback)
    const fetchLatestSalinity = async () => {
      try {
        const response = await fetch("https://login-signup-3470.onrender.com/api/sensors/latest");
        if (!response.ok) throw new Error("No data found");
        const latestData = await response.json();
        // Assuming your backend sends 'salinity_value' for dissolved content
        setSalinity(latestData.salinity_value); 
        console.log("📂 Fetched latest salinity value:", latestData.salinity_value);
      } catch (err) {
        console.warn("⚠️ Could not fetch latest salinity data:", err.message);
      }
    };

    fetchLatestSalinity();

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("updateSalinityData", handleSalinityData);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("updateSalinityData", handleSalinityData);
    };
  }, []);

  const getWaterQuality = () => {
    if (salinity >= 70 && salinity <= 100) return "Safe";
    if (salinity >= 40 && salinity < 70) return "Moderate";
    if (salinity > 0 && salinity < 40) return "Not Safe";
    if (salinity === 0) return "Critical";
    return "Unknown"; // Fallback for values outside defined ranges
  };

  // Calculate percentage out of 100
  // This ensures the progress bar visually represents the 0-100 scale.
  const percentage = Math.min(Math.max(salinity, 0), 100); 

  // Determine path color based on safety ranges
  const getPathColor = () => {
    if (!isConnected) return "#d9534f"; // Disconnected color
    if (salinity >= 70 && salinity <= 100) return "#20a44c"; // Safe (Green)
    if (salinity >= 40 && salinity < 70) return "#f0ad4e"; // Moderate (Orange)
    if (salinity > 0 && salinity < 40) return "#d9534f"; // Not Safe (Red)
    if (salinity === 0) return "#777"; // Critical (Darker color)
    return "#5bc0de"; // Default or unknown color (Light Blue)
  };
  
  // Determine text color based on water quality
  const getQualityTextColor = () => {
    const quality = getWaterQuality();
    switch(quality) {
      case "Safe": return "#20a44c"; // Green
      case "Moderate": return "#f0ad4e"; // Orange
      case "Not Safe": return "#d9534f"; // Red
      case "Critical": return "#777"; // Gray
      default: return "#5bc0de"; // Blue
    }
  };

  const meterStyles = {
    container: {
      position: 'relative',
      backgroundColor: theme === 'dark' ? '#1e1f21' : '#ffffff',
      borderRadius: '12px',
      padding: '1.2rem',
      boxShadow: theme === 'dark' 
        ? '0 8px 16px rgba(0, 0, 0, 0.4)' 
        : '0 8px 16px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      transform: isAnimating ? 'scale(1.03)' : 'scale(1)',
      border: theme === 'dark' 
        ? '1px solid #444' 
        : '1px solid #e5e7eb',
    },
    header: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: '1rem',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1.1rem',
      fontWeight: '600',
      color: theme === 'dark' ? '#ffffff' : '#333333',
      marginBottom: '0.5rem',
    },
    statusIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      borderRadius: '16px',
      fontSize: '0.8rem',
      fontWeight: '500',
      backgroundColor: isConnected 
        ? (theme === 'dark' ? 'rgba(32, 164, 76, 0.2)' : 'rgba(32, 164, 76, 0.1)') 
        : (theme === 'dark' ? 'rgba(217, 83, 79, 0.2)' : 'rgba(217, 83, 79, 0.1)'),
      color: isConnected ? '#20a44c' : '#d9534f',
      transition: 'all 0.3s ease',
      alignSelf: 'flex-start',
    },
    meter: {
      width: '90%',
      maxWidth: '220px',
      margin: '0 auto',
      padding: '10px 0',
    },
    valueText: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      transition: 'all 0.3s ease',
    },
    label: {
      fontSize: '0.85rem',
      color: theme === 'dark' ? '#aaa' : '#777',
      marginBottom: '0.2rem',
    },
    value: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: getPathColor(),
      marginBottom: '0.2rem',
      transition: 'color 0.3s ease',
    },
    unit: {
      fontSize: '0.8rem',
      color: theme === 'dark' ? '#aaa' : '#777',
    },
    qualityContainer: {
      marginTop: '1rem',
      textAlign: 'center',
      padding: '8px 0',
      borderTop: theme === 'dark' ? '1px solid #444' : '1px solid #e5e7eb',
    },
    qualityLabel: {
      fontSize: '0.9rem',
      color: theme === 'dark' ? '#ddd' : '#555',
    },
    qualityValue: {
      fontWeight: 'bold',
      color: getQualityTextColor(),
      transition: 'color 0.3s ease',
    },
    toggle: {
      position: 'relative',
      display: 'inline-block',
      width: '60px',
      height: '24px',
      cursor: 'pointer',
    },
    slider: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isConnected 
        ? (theme === 'dark' ? '#20a44c' : '#1dc958') 
        : (theme === 'dark' ? '#444' : '#ccc'),
      borderRadius: '12px',
      transition: 'background-color 0.3s ease',
    },
    knob: {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: isConnected ? '38px' : '4px',
      bottom: '3px',
      backgroundColor: theme === 'dark' ? '#fff' : '#fff',
      borderRadius: '50%',
      transition: 'left 0.3s ease',
    }
  };

  return (
    <div style={meterStyles.container}>
      <div style={meterStyles.header}>
        <div style={meterStyles.title}>
          <Activity size={18} color={getPathColor()} />
          Salinity
        </div>
        <div style={meterStyles.statusIndicator}>
          {isConnected ? (
            <>
              <Wifi size={14} />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>Disconnected</span>
            </>
          )}
        </div>
      </div>

      <div style={meterStyles.meter}>
        <CircularProgressbarWithChildren
          value={percentage}
          styles={buildStyles({
            pathColor: getPathColor(),
            trailColor: theme === "dark" ? "#333" : "#e5e7eb",
            strokeLinecap: "round",
            pathTransition: isAnimating ? "stroke-dashoffset 0.5s ease 0s" : "none",
            // Customize thickness
            strokeWidth: 12,
          })}
        >
          <div style={meterStyles.valueText}>
            <span style={meterStyles.label}>Reading</span>
            <span style={meterStyles.value}>{salinity}</span>
            <span style={meterStyles.unit}>Safety Score</span>
          </div>
        </CircularProgressbarWithChildren>
      </div>

      <div style={meterStyles.qualityContainer}>
        <span style={meterStyles.qualityLabel}>
          Water Quality: {' '}
          <span style={meterStyles.qualityValue}>
            {getWaterQuality()}
          </span>
        </span>
      </div>

      {/* Connection toggle for visual reference only */}
      <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
        <div style={meterStyles.toggle}>
          <div style={meterStyles.slider}>
            <div style={meterStyles.knob}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Salinity;