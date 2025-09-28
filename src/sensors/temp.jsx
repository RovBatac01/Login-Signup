import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client"; // Import io for Socket.IO
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./sensorsCSS/temp.css";

const WaterTemperature = ({ theme, filter }) => { // Accept 'filter' prop
  const [temperatureData, setTemperatureData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null); // State to hold the socket instance

  // useCallback memoizes the function, preventing unnecessary re-creations
  // This is crucial because it's a dependency in useEffect
  const fetchData = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);

    let endpoint = "";
    let isRealtime = false;

    // Determine the API endpoint based on the filter
    switch (currentFilter) {
      case "realtime":
        endpoint = "http://localhost:5000/data/temperature/realtime";
        isRealtime = true;
        break;
      case "24h":
        endpoint = "http://localhost:5000/data/temperature/24h";
        break;
      case "7d-avg": // Corresponds to '7d-avg' on backend
        endpoint = "http://localhost:5000/data/temperature/7d-avg";
        break;
      case "30d-avg": // Corresponds to '30d-avg' on backend
        endpoint = "http://localhost:5000/data/temperature/30d-avg";
        break;
      default:
        endpoint = "http://localhost:5000/data/temperature/24h"; // Fallback if filter is unexpected
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
  // For '7d-avg' and '30d-avg', item.timestamp will be a date string like 'YYYY-MM-DD'
  // For '24h' or 'realtime', it will be a full datetime string.
  // You can conditionally format or let toLocaleString handle it (it's usually smart enough)
  timestamp: (filter === '7d-avg' || filter === '30d-avg')
               ? new Date(item.timestamp).toLocaleDateString()
               : new Date(item.timestamp).toLocaleString(),
  temperature: parseFloat(item.value) || 0,
}));
        setTemperatureData(formattedData);
      } catch (err) {
        console.error(`Failed to fetch ${currentFilter} data for Temperature:`, err);
        setError("Failed to fetch historical temperature data.");
      } finally {
        setLoading(false);
      }
    } else {
      // Handle real-time data: Connect/reconnect socket and fetch initial real-time data
      if (!socket) { // Only create a new socket if one doesn't exist
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        // Listen for specific temperature updates (assuming backend emits 'updateTemperatureData')
        newSocket.on("updateTemperatureData", (newData) => {
          setTemperatureData(prevData => {
            // Keep a reasonable number of real-time data points, e.g., last 30
            const updatedData = [...prevData.slice(-29), {
              timestamp: new Date(newData.timestamp).toLocaleTimeString(), // Use timestamp from backend
              temperature: parseFloat(newData.value) || 0,
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
            temperature: parseFloat(item.value) || 0,
          }));
          setTemperatureData(formattedInitialData);
        } else {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
      } catch (initialErr) {
        console.warn("Could not fetch initial real-time data for Temperature:", initialErr);
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

  if (loading) return <div className="loading-message">Loading temperature data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  // Define colors dynamically based on theme
  const textColor = theme === "dark" ? "#ffffff" : "#333333";
  const gridColor = theme === "dark" ? "#555555" : "#cccccc";
  const lineColor = theme === "dark" ? "#ffcc00" : "#ff4500"; // Yellow for dark mode, Red for light mode
  const tooltipBg = theme === "dark" ? "#222222" : "#ffffff";


  return (
    <div className={`water-temperature-container ${theme}`}>
      <h2 style={{ color: textColor }}>Water Temperature</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={temperatureData}>
          <XAxis
            dataKey="timestamp" // Changed from 'time' to 'timestamp'
            tick={{ fontSize: 12, fill: textColor, fontWeight: "bold" }}
            angle={-17}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]} // Keep domain as 0-100 for temperature range
            tick={{ fill: textColor }}
            label={{ value: "°C", angle: -90, position: "insideLeft", fill: textColor }}
          />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: textColor }} />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Line type="monotone" dataKey="temperature" stroke={lineColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WaterTemperature; // Exporting as WaterTemperature