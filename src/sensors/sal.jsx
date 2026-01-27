import React, { useState, useEffect, useCallback } from "react";
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./sensorsCSS/do.css"; // Still assuming a specific CSS for Salinity

const DOMonitor = ({ theme, filter }) => { // Component name remains DOMonitor
  const [salinityDataPoints, setSalinityDataPoints] = useState([]); // State for salinity data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null); // State to hold the socket instance

  const fetchData = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);

    let endpoint = "";
    let isRealtime = false;

    // Determine the API endpoint based on the filter for Salinity
    switch (currentFilter) {
      case "realtime":
        endpoint = "https://login-signup-3470.onrender.com/data/salinity/realtime";
        isRealtime = true;
        break;
      case "24h":
        endpoint = "https://login-signup-3470.onrender.com/data/salinity/24h";
        break;
      case "7d-avg": // Corresponds to '7d-avg' on backend
        endpoint = "https://login-signup-3470.onrender.com/data/salinity/7d-avg";
        break;
      case "30d-avg": // Corresponds to '30d-avg' on backend
        endpoint = "https://login-signup-3470.onrender.com/data/salinity/30d-avg";
        break;
      default:
        endpoint = "https://login-signup-3470.onrender.com/data/salinity/24h"; // Fallback
        break;
    }

    if (!isRealtime) {
      // If switching to a historical view, disconnect any active real-time socket
      if (socket) {
        socket.disconnect();
        setSocket(null); // Clear the socket instance
      }
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const formattedData = data.map(item => ({
          // Backend sends 'timestamp' for 24h as full datetime, for 7d/30d as 'YYYY-MM-DD'
          timestamp: new Date(item.timestamp).toLocaleString(),
          value: parseFloat(item.value) || 0, // 'value' is the alias from backend SQL queries
        }));
        setSalinityDataPoints(formattedData);
      } catch (err) {
        console.error(`Failed to fetch ${currentFilter} data for Salinity:`, err);
        setError("Failed to fetch historical salinity data.");
      } finally {
        setLoading(false);
      }
    } else {
      // Handle real-time data: Connect/reconnect socket and fetch initial real-time data
      if (!socket) { // Only create a new socket if one doesn't exist
        const newSocket = io("https://login-signup-3470.onrender.com");
        setSocket(newSocket);

        // Listen for specific salinity updates (assuming backend emits 'updateSalinityData')
        newSocket.on("updateSalinityData", (newData) => {
          setSalinityDataPoints(prevData => {
            // Keep a reasonable number of real-time data points, e.g., last 30
            const updatedData = [...prevData.slice(-29), {
              timestamp: new Date(newData.timestamp).toLocaleTimeString(),
              value: parseFloat(newData.value) || 0,
            }];
            return updatedData;
          });
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setError("Failed to connect to real-time updates.");
        });
      }
      // Fetch initial set of real-time data to populate the graph immediately
      // before new socket data streams in.
      try {
        const initialResponse = await fetch(endpoint); // Uses the 'realtime' endpoint
        if (initialResponse.ok) {
          const initialData = await initialResponse.json();
          const formattedInitialData = initialData.map(item => ({
            timestamp: new Date(item.timestamp).toLocaleTimeString(),
            value: parseFloat(item.value) || 0,
          }));
          setSalinityDataPoints(formattedInitialData);
        } else {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
      } catch (initialErr) {
        console.warn("Could not fetch initial real-time data for Salinity:", initialErr);
        // Don't set error state if it's just initial fetch failing but socket might work
      } finally {
        setLoading(false);
      }
    }
  }, [socket]); // Add socket to dependencies, to ensure useCallback is stable

  // useEffect hook that runs when the 'filter' prop changes
  useEffect(() => {
    // Only fetch data if the filter is defined (not null/undefined on initial render)
    if (filter) {
      fetchData(filter);
    }

    // Cleanup function for socket connection when component unmounts or filter changes to non-realtime
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [filter, fetchData]); // Dependencies: Re-run effect when 'filter' or 'fetchData' changes

  if (loading) return <div className="loading-message">Loading salinity data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Define theme-based colors dynamically
  const textColor = theme === "dark" ? "#ffffff" : "#333333";
  const gridColor = theme === "dark" ? "#555555" : "#cccccc";
  const lineColor = theme === "dark" ? "#3498db" : "#FF5733";
  const tooltipBg = theme === "dark" ? "#222222" : "#ffffff";
  const tooltipBorder = theme === "dark" ? "#444444" : "#cccccc";
  const tooltipTextColor = theme === "dark" ? "#ffffff" : "#333333";

  return (
    <div className={`aqua-salinity-container ${theme}`}>
      <h2 style={{ color: textColor }}>Salinity Level (ppt)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={salinityDataPoints}>
          <XAxis
            dataKey="timestamp" // Data from backend will use 'timestamp'
            tick={{ fontSize: 12, fill: textColor, fontWeight: "bold" }}
            angle={-17}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]} // Typical salinity range
            tick={{ fill: textColor }}
            label={{ value: "ppt", angle: -90, position: "insideLeft", fill: textColor }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder }}
            itemStyle={{ color: tooltipTextColor }}
            labelStyle={{ color: tooltipTextColor }}
          />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} /> {/* Using 'value' from backend data */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DOMonitor; // Exporting the component as DOMonitor