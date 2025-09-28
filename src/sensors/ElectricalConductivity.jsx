import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import "./sensorsCSS/ec.css";

const ElectricalConductivity = ({ theme, filter }) => {
  const [conductivityData, setConductivityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  const fetchData = useCallback(async (currentFilter) => {
    setLoading(true);
    setError(null);

    let endpoint = "";
    let isRealtime = false;

    switch (currentFilter) {
      case "realtime":
        endpoint = "http://localhost:5000/data/ec/realtime";
        isRealtime = true;
        break;
      case "24h":
        endpoint = "http://localhost:5000/data/ec/24h";
        break;
      case "7d-avg":
        // FIX: Changed endpoint to match backend's "7d-avg"
        endpoint = "http://localhost:5000/data/ec/7d-avg";
        break;
      case "30d-avg":
        // FIX: Changed endpoint to match backend's "30d-avg"
        endpoint = "http://localhost:5000/data/ec/30d-avg";
        break;
      default:
        endpoint = "http://localhost:5000/data/ec/24h";
        break;
    }

    if (!isRealtime) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const formattedData = data.map(item => ({
          timestamp: new Date(item.timestamp).toLocaleString(),
          conductivity: parseFloat(item.value) || 0,
        }));
        setConductivityData(formattedData);
      } catch (err) {
        console.error(`Failed to fetch ${currentFilter} data for Electrical Conductivity:`, err);
        setError("Failed to fetch historical electrical conductivity data.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!socket) {
        const newSocket = io("http://localhost:5000");
        setSocket(newSocket);

        newSocket.on("updateECData", (newData) => {
          setConductivityData(prevData => {
            const updatedData = [...prevData.slice(-29), {
              timestamp: new Date(newData.timestamp).toLocaleTimeString(),
              conductivity: parseFloat(newData.value) || 0,
            }];
            return updatedData;
          });
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setError("Failed to connect to real-time updates.");
        });
      }
      try {
        const initialResponse = await fetch(endpoint);
        if (initialResponse.ok) {
          const initialData = await initialResponse.json();
          const formattedInitialData = initialData.map(item => ({
            timestamp: new Date(item.timestamp).toLocaleTimeString(),
            conductivity: parseFloat(item.value) || 0,
          }));
          setConductivityData(formattedInitialData);
        } else {
            throw new Error(`HTTP error! status: ${initialResponse.status}`);
        }
      } catch (initialErr) {
        console.warn("Could not fetch initial real-time data for Electrical Conductivity:", initialErr);
      } finally {
        setLoading(false);
      }
    }
  }, [socket]);

  useEffect(() => {
    if (filter) {
      fetchData(filter);
    }
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [filter, fetchData]);

  if (loading) return <div className="loading-message">Loading conductivity data...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  const textColor = theme === "dark" ? "#ffffff" : "#333333";
  const gridColor = theme === "dark" ? "#555555" : "#cccccc";
  const lineColor = theme === "dark" ? "#00d1ff" : "#0077b6";
  const tooltipBg = theme === "dark" ? "#222222" : "#ffffff";

  return (
    <div className={`electrical-conductivity-container ${theme}`}>
      <h2 style={{ color: textColor }}>Electrical Conductivity</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={conductivityData}>
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12, fill: textColor, fontWeight: "bold" }}
            angle={-17}
            textAnchor="end"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: textColor }}
            label={{ value: "μS/cm", angle: -90, position: "insideLeft", fill: textColor }}
          />
          <Tooltip contentStyle={{ backgroundColor: tooltipBg, color: textColor }} />
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <Line type="monotone" dataKey="conductivity" stroke={lineColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ElectricalConductivity;