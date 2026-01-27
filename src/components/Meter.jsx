import React, { useEffect, useState, useContext } from "react";
import { RadialBarChart, RadialBar } from "recharts";
import axios from "axios";
import { io } from "socket.io-client";
import "../styles/meter.css";
import { ThemeContext } from "../context/ThemeContext"; // Import ThemeContext

// ✅ Connect to WebSocket
const socket = io("https://login-signup-3470.onrender.com");

const GaugeMeter = () => {
  const { theme } = useContext(ThemeContext); // Use ThemeContext for theme
  const [value, setValue] = useState(0);

  useEffect(() => {
    // ✅ Fetch initial data from the backend
    axios.get("https://login-signup-3470.onrender.com/data").then((response) => {
      if (response.data.length > 0) {
        console.log("📡 Initial Data:", response.data[0].turbidity_value);
        setValue(response.data[0].turbidity_value);
      }
    });

    // ✅ Listen for real-time updates
    const handleNewData = (newData) => {
      console.log("🔄 New Data Received:", newData);
      setValue(newData.value);
    };

    socket.on("updateData", handleNewData);

    return () => socket.off("updateData", handleNewData);
  }, []);

  // ✅ Determine water quality status
  const getWaterQuality = () => {
    if (value >= 70) return { text: "Clean Water", color: "text-green-400" };
    if (value >= 40) return { text: "Moderate", color: "text-yellow-400" };
    return { text: "Contaminated", color: "text-red-500" };
  };

  const { text, color } = getWaterQuality();
  const data = [{ name: "Turbidity", value, fill: "#6FCF97" }];

  return (
    <div className={`gauge-meter ${theme}`}>
      <div className="gauge-meter-container">
        <RadialBarChart
          width={200}
          height={120}
          cx={100}
          cy={100}
          innerRadius={60}
          outerRadius={100}
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <RadialBar minAngle={15} background dataKey="value" cornerRadius={5} />
        </RadialBarChart>
      </div>

      <p className="gauge-meter-value">{value}%</p>
      <p className={`gauge-meter-status ${color}`}>{text}</p>
    </div>
  );
};

export default GaugeMeter;
