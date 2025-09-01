import React, { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { io } from 'socket.io-client'; // Ensure 'io' is imported correctly for consistency
import "./sensorsCSS/phlevel.css";

const PHLevelMonitor = ({ theme, filter }) => { // Accept 'filter' prop, remove updateSensorData
  const [phData, setPhData] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(null);   // Added error state
  const [socket, setSocket] = useState(null); // State to hold the socket instance

  const fetchData = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);

    let endpoint = "";
    let isRealtime = false;

    // Determine the API endpoint based on the filter
    switch (currentFilter) {
      case "realtime":
        endpoint = "https://login-signup-3470.onrender.com/data/phlevel/realtime";
        isRealtime = true;
        break;
      case "24h":
        endpoint = "https://login-signup-3470.onrender.com/data/phlevel/24h";
        break;
      case "7d-avg": // Corresponds to '7d-avg' on backend
        endpoint = "https://login-signup-3470.onrender.com/data/phlevel/7d-avg";
        break;
      case "30d-avg": // Corresponds to '30d-avg' on backend
        endpoint = "https://login-signup-3470.onrender.com/data/phlevel/30d-avg";
        break;
      default:
        endpoint = "https://login-signup-3470.onrender.com/data/phlevel/24h"; // Fallback if filter is unexpected
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
          ph: parseFloat(item.value) || 0, // 'value' is the alias from backend SQL queries
        }));
        setPhData(formattedData);
      } catch (err) {
        console.error(`Failed to fetch ${currentFilter} data for pH Level:`, err);
        setError("Failed to fetch historical pH level data.");
      } finally {
        setLoading(false);
      }
    } else {
      // Handle real-time data: Connect/reconnect socket and fetch initial real-time data
      if (!socket) { // Only create a new socket if one doesn't exist
        const newSocket = io("https://login-signup-3470.onrender.com");
        setSocket(newSocket);

        // Listen for specific pH level updates (assuming backend emits 'updatePHData')
        newSocket.on("updatePHData", (newData) => {
          setPhData(prevData => {
            // Keep a reasonable number of real-time data points, e.g., last 30
            const updatedData = [...prevData.slice(-29), {
              timestamp: new Date(newData.timestamp).toLocaleTimeString(), // Use timestamp from backend
              ph: parseFloat(newData.value) || 0,
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
            ph: parseFloat(item.value) || 0,
          }));
          setPhData(formattedInitialData);
        } else {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
      } catch (initialErr) {
        console.warn("Could not fetch initial real-time data for pH Level:", initialErr);
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

  if (loading) return <div className="loading-message">Loading pH level data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Define colors dynamically based on theme
  const textColor = theme === "dark" ? "#ffffff" : "#333333";
  const gridColor = theme === "dark" ? "#555555" : "#cccccc";
  const lineColor = theme === "dark" ? "#8884d8" : "#ff7300"; // Your chosen colors
  const tooltipBg = theme === "dark" ? "#222222" : "#ffffff";


  return (
    <div className={`ph-level-container ${theme}`}>
      <h2 style={{ color: textColor }}>Water pH Level</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={phData}>
          <XAxis
            dataKey="timestamp" // Changed from 'time' to 'timestamp'
            tick={{ fontSize: 12, fill: textColor, fontWeight: "bold" }}
            angle={-17}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 14]} // pH range is typically 0-14
            tick={{ fill: textColor }}
            label={{ value: "pH", angle: -90, position: "insideLeft", fill: textColor }}
          />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: textColor }} />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Line type="monotone" dataKey="ph" stroke={lineColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PHLevelMonitor;