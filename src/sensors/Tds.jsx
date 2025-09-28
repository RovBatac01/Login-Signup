import React, { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { io } from 'socket.io-client'; // Ensure 'io' is imported correctly
import "./sensorsCSS/tds.css";

const TDSMonitor = ({ theme, filter }) => { // Accept 'filter' prop, remove updateSensorData
  const [tdsData, setTdsData] = useState([]);
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
        endpoint = "http://localhost:5000/data/tds/realtime";
        isRealtime = true;
        break;
      case "24h":
        endpoint = "http://localhost:5000/data/tds/24h";
        break;
      case "7d-avg": // Corresponds to '7d-avg' on backend
        endpoint = "http://localhost:5000/data/tds/7d-avg";
        break;
      case "30d-avg": // Corresponds to '30d-avg' on backend
        endpoint = "http://localhost:5000/data/tds/30d-avg";
        break;
      default:
        endpoint = "http://localhost:5000/data/tds/24h"; // Fallback if filter is unexpected
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
          tds: parseFloat(item.value) || 0, // 'value' is the alias from backend SQL queries
        }));
        setTdsData(formattedData);
      } catch (err) {
        console.error(`Failed to fetch ${currentFilter} data for TDS:`, err);
        setError("Failed to fetch historical TDS data.");
      } finally {
        setLoading(false);
      }
    } else {
      // Handle real-time data: Connect/reconnect socket and fetch initial real-time data
      if (!socket) { // Only create a new socket if one doesn't exist
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        // Listen for specific TDS updates (assuming backend emits 'updateTDSData')
        newSocket.on("updateTDSData", (newData) => {
          setTdsData(prevData => {
            // Keep a reasonable number of real-time data points, e.g., last 30
            const updatedData = [...prevData.slice(-29), {
              timestamp: new Date(newData.timestamp).toLocaleTimeString(), // Use timestamp from backend
              tds: parseFloat(newData.value) || 0,
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
            tds: parseFloat(item.value) || 0,
          }));
          setTdsData(formattedInitialData);
        } else {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
      } catch (initialErr) {
        console.warn("Could not fetch initial real-time data for TDS:", initialErr);
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

  if (loading) return <div className="loading-message">Loading TDS data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Define colors dynamically based on theme
  const textColor = theme === "dark" ? "#ffffff" : "#333333";
  const gridColor = theme === "dark" ? "#555555" : "#cccccc";
  const lineColor = theme === "dark" ? "#FF5733" : "#3388FF"; // Your chosen colors
  const tooltipBg = theme === "dark" ? "#222222" : "#ffffff";


  return (
    <div className={`tds-monitor-container ${theme}`}>
      <h2 style={{ color: textColor }}>Total Dissolved Solids (TDS)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={tdsData}>
          <XAxis
            dataKey="timestamp" // Changed from 'time' to 'timestamp'
            tick={{ fontSize: 12, fill: textColor, fontWeight: "bold" }}
            angle={-17}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]} // Keeping your original domain for TDS
            tick={{ fill: textColor }}
            label={{ value: "ppm", angle: -90, position: "insideLeft", fill: textColor }}
          />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: textColor }} />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Line type="monotone" dataKey="tds" stroke={lineColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TDSMonitor;