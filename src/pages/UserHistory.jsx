import React, { useContext, useState, useEffect } from "react"; // Added useEffect
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "../styles/Pages Css/AdminHistory.css";
import Temp from "../sensors/temp";
import PhLevel from "../sensors/phlevel"; // Make sure the component name matches the import
import Turbidity from "../sensors/turbudity";
import Tds from "../sensors/Tds";
import Sal from "../sensors/sal";
import Conductivity from "../sensors/Conductivity";
import ElectricalConductivity from "../sensors/ElectricalConductivity";
import "../styles/theme.css";
import { ThemeContext } from "../context/ThemeContext";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { AuthContext } from '../context/AuthContext'; // Import AuthContext
import { exportToPdf, savePdf } from "../utils/pdfExport";
import PageTitle from "../components/PageTitle";

// Renamed the component from History to UserHistory
const UserHistory = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { currentUser, getToken } = useContext(AuthContext); // Get currentUser and getToken from AuthContext

    // State for the deviceId, which will be equivalent to establishmentId for a user
    const [deviceId, setDeviceId] = useState(null); // Initialize as null
    const [filter, setFilter] = useState("24h");
    const [exporting, setExporting] = useState(false);
    const [selectedSensorForModal, setSelectedSensorForModal] = useState(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [exportingPdf, setExportingPdf] = useState(false);

    // State to hold the dynamically fetched list of available sensors for the user's device
    const [userAssociatedSensors, setUserAssociatedSensors] = useState([]);
    const [isLoadingSensors, setIsLoadingSensors] = useState(true);

    // Define all possible sensors (like allSensorDefinitions in AdminHistory)
    const allSensorDefinitions = [
        { name: "Turbidity", tableName: "turbidity_readings", valueColumn: "turbidity_value", apiPath: "/turbidity", component: Turbidity, cssClass: "aqua-turbidity-container" },
        // IMPORTANT: Ensure this name matches what your backend returns EXACTLY for the pH sensor
        // Based on Userdb.jsx, it's likely "ph Level" (lowercase 'p', lowercase 'h')
        { name: "ph Level", tableName: "phlevel_readings", valueColumn: "ph_value", apiPath: "/phlevel", component: PhLevel, cssClass: "aqua-ph-level-container" },
        { name: "Total Dissolved Solids", tableName: "tds_readings", valueColumn: "tds_value", apiPath: "/tds", component: Tds, cssClass: "aqua-tds-container" }, // Use full name for consistency
        { name: "Salinity", tableName: "salinity_readings", valueColumn: "salinity_value", apiPath: "/salinity", component: Sal, cssClass: "aqua-salinity-container" },
        { name: "Conductivity", tableName: "ec_readings", valueColumn: "ec_value_mS", apiPath: "/ec", component: Conductivity, cssClass: "aqua-conductivity-container" },
        { name: "Electrical Conductivity", tableName: "ec_compensated_readings", valueColumn: "ec_compensated_mS", apiPath: "/ec-compensated", component: ElectricalConductivity, cssClass: "aqua-electrical-conductivity-container" },
        { name: "Temperature", tableName: "temperature_readings", valueColumn: "temperature_celsius", apiPath: "/temperature", component: Temp, cssClass: "aqua-water-temperature-container" },
    ];

    // Combined Effect to get the deviceId and fetch associated sensors
    useEffect(() => {
        let currentDeviceId = null;

        // Try to get device ID from AuthContext (this is how Userdb gets it)
        if (currentUser && currentUser.deviceId) {
            currentDeviceId = currentUser.deviceId;
            console.log("Device ID from AuthContext:", currentDeviceId);
        } else {
            // Fallback to localStorage if not in AuthContext (if you store it there)
            // Userdb.jsx polls localStorage, so it's a valid pattern here if currentUser isn't immediate
            const storedUserString = localStorage.getItem("user");
            if (storedUserString) {
                try {
                    const storedUser = JSON.parse(storedUserString);
                    if (storedUser.deviceId) {
                        currentDeviceId = storedUser.deviceId;
                        console.log("Device ID from localStorage:", currentDeviceId);
                    }
                } catch (e) {
                    console.error("Error parsing user from localStorage:", e);
                }
            }
        }

        // Update the state variable `deviceId`
        setDeviceId(currentDeviceId);

        const fetchAssociatedSensors = async (id) => {
            // Only fetch if a valid device ID is available
            if (!id) {
                setMessage('No device ID found. Cannot load sensor data.');
                setMessageType('error');
                setIsLoadingSensors(false);
                setUserAssociatedSensors([]); // Clear sensors if no ID
                return;
            }

            setIsLoadingSensors(true);
            setMessage(''); // Clear previous messages
            setMessageType('');

            try {
                const token = getToken(); // Get token for authorized request
                if (!token) {
                    console.error("No authentication token available for sensor fetch.");
                    setMessage("Authentication required to fetch sensors.");
                    setMessageType('error');
                    setIsLoadingSensors(false);
                    return;
                }

                // Fetch list of sensors for the device
                // This assumes an endpoint like /api/devices/:deviceId/sensors exists
                const response = await fetch(`http://localhost:5000/api/devices/${id}/sensors`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch device sensors: ${response.statusText}`);
                }
                const data = await response.json();

                // Backend is returning an array of objects like { id: ..., sensor_name: "ph Level" }
                // So we map to get just the sensor_name strings
                const sensorNames = data.map(sensor => sensor.sensor_name);
                setUserAssociatedSensors(sensorNames);
                console.log("Fetched user associated sensors:", sensorNames);

            } catch (error) {
                console.error("Error fetching user associated sensors:", error);
                setMessage(`Failed to load sensors for your device: ${error.message}`);
                setMessageType('error');
                setUserAssociatedSensors([]); // Clear any previous sensors on error
            } finally {
                setIsLoadingSensors(false);
            }
        };

        // Only call fetchAssociatedSensors if currentDeviceId is available
        if (currentDeviceId) {
            fetchAssociatedSensors(currentDeviceId);
        } else {
            // If still no ID after checks, make sure loading state is off
            setIsLoadingSensors(false);
        }

    }, [currentUser, getToken]); // Re-run this effect when currentUser or getToken changes

    // Filter sensorDefinitions based on the fetched userAssociatedSensors
    // This will re-evaluate whenever userAssociatedSensors state changes
    const sensorDefinitionsToRender = allSensorDefinitions.filter(sensor =>
        userAssociatedSensors.includes(sensor.name)
    );
    console.log("Filtered sensor definitions (for rendering User History):", sensorDefinitionsToRender);


    // Function to open the modal
    const openSensorModal = (sensorData) => {
        setSelectedSensorForModal(sensorData);
    };

    // Function to close the modal
    const closeSensorModal = () => {
        setSelectedSensorForModal(null);
    };

    const exportToExcel = async () => {
        setExporting(true);
        setMessage('');
        setMessageType('');
        let dataToExport = {};

        // Ensure deviceId is available
        if (!deviceId) {
            setMessage('Cannot export: Device ID is missing.');
            setMessageType('error');
            setExporting(false);
            return;
        }

        try {
            const filterToEndpoint = {
                "realtime": "realtime",
                "24h": "24h",
                "7d": "7d-avg",
                "30d": "30d-avg",
            };

            const backendFilter = filterToEndpoint[filter];
            if (!backendFilter) {
                setMessage('Invalid filter selected for export.');
                setMessageType('error');
                setExporting(false);
                return;
            }

            // Fetch data ONLY for the filtered sensors that are associated with the user's device
            // Use sensorDefinitionsToRender here to ensure we only export what's displayed
            for (const sensor of sensorDefinitionsToRender) {
                // IMPORTANT: For User History, your API paths might need to include deviceId
                // Example: /data/turbidity/24h?deviceId=YOUR_DEVICE_ID
                // Adjust your data fetching API calls if they also need deviceId in the path or query
                const endpoint = `http://localhost:5000/data${sensor.apiPath}/${backendFilter}?deviceId=${deviceId}`;
                console.log(`Fetching data for ${sensor.name} from: ${endpoint}`);
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${sensor.name} data: ${response.statusText}`);
                }
                const data = await response.json();

                const formattedSensorData = data.map(item => ({
                    Timestamp: new Date(item.timestamp).toLocaleString(),
                    Value: parseFloat(item.value),
                    Unit: getSensorUnit(sensor.name)
                }));
                dataToExport[sensor.name] = formattedSensorData;
            }

            const hasData = Object.values(dataToExport).some(arr => arr.length > 0);
            if (!hasData) {
                setMessage('No data available for export based on the selected filter and your device.');
                setMessageType('error');
                setExporting(false);
                return;
            }

            const wb = XLSX.utils.book_new();
            Object.keys(dataToExport).forEach((sensorName) => {
                if (dataToExport[sensorName].length > 0) {
                    const ws = XLSX.utils.json_to_sheet(dataToExport[sensorName]);
                    XLSX.utils.book_append_sheet(wb, ws, sensorName);
                }
            });

            const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
            });

            saveAs(blob, `SensorData_${filter}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            console.log("Excel file exported successfully.");
            setMessage('Excel file exported successfully!');
            setMessageType('success');

        } catch (error) {
            console.error("Error exporting Excel:", error);
            setMessage(`Error exporting data: ${error.message}`);
            setMessageType('error');
        } finally {
            setExporting(false);
        }
    };

        // Export to PDF function
        const exportToPDF = async () => {
            setExportingPdf(true);
            
            try {
                const dataToExport = await fetchSensorData();
                if (!dataToExport) {
                    setExportingPdf(false);
                    return;
                }
    
                // Generate PDF using our utility function
                const establishmentName = user?.establishmentName || "All Establishments";
                const pdfBlob = exportToPdf(dataToExport, filter, establishmentName);
                
                // Save the PDF
                savePdf(pdfBlob, filter, establishmentName);
                console.log("PDF file exported successfully.");
    
            } catch (error) {
                console.error("Error exporting PDF:", error);
                alert(`Error exporting PDF: ${error.message}. Check browser console for details.`);
            } finally {
                setExportingPdf(false);
            }
        };

    const getSensorUnit = (sensorName) => {
        switch (sensorName) {
            case "Turbidity": return "NTU";
            // Match the casing used in allSensorDefinitions for consistency
            case "ph Level": return "pH";
            case "Total Dissolved Solids": return "ppm"; // Changed from "TDS" to match full name
            case "Salinity": return "ppt";
            case "Conductivity": return "mS/cm";
            case "Electrical Conductivity": return "mS/cm";
            case "Temperature": return "°C";
            default: return "";
        }
    };

    if (isLoadingSensors) {
        return (
            <div className={`aqua-history-page ${theme}`}>
                <Sidebar theme={theme} toggleTheme={toggleTheme} />
                <div className="aqua-history-content-wrapper">
                    <PageTitle title="SENSOR HISTORY" />
                    <div className="aqua-history-sensors-grid">
                        <p>Loading your device's sensors...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Only render the components if deviceId is available and user is verified (implicitly via fetch success)
    // If no sensors are found but loading is complete, display a message
    const hasSensors = sensorDefinitionsToRender.length > 0;

    return (
        <div className={`aqua-history-page ${theme}`}>
            <div className="aqua-history-container">
                <Sidebar theme={theme} toggleTheme={toggleTheme} />

                <div className="aqua-history-content-wrapper">
                    <PageTitle title="SENSOR HISTORY" />
                    {message && (
                        <div className={`settings-page-message-box ${messageType === 'success' ? 'settings-page-message-success' : 'settings-page-message-error'}`}>
                            {message}
                        </div>
                    )}
                    <div className="aqua-history-sensors-grid">

                    <div className="aqua-history-controls">
                        <div className="aqua-filter-buttons">
                            <button onClick={() => setFilter("realtime")} className={filter === "realtime" ? "active" : ""}>
                                Real-time
                            </button>
                            <button onClick={() => setFilter("24h")} className={filter === "24h" ? "active" : ""}>
                                Last 24 Hours
                            </button>
                            <button onClick={() => setFilter("7d")} className={filter === "7d" ? "active" : ""}>
                                Last 7 Days (Avg)
                            </button>
                            <button onClick={() => setFilter("30d")} className={filter === "30d" ? "active" : ""}>
                                Last 30 Days (Avg)
                            </button>
                        </div>

                        <div className="aqua-export-buttons">
                            <button onClick={exportToExcel} className="aqua-export-btn excel-btn" disabled={exporting || exportingPdf}>
                                {exporting ? "Exporting..." : "Export Excel"}
                            </button>
                            <button onClick={exportToPDF} className="aqua-export-btn pdf-btn" disabled={exporting || exportingPdf}>
                                {exportingPdf ? "Exporting..." : "Export PDF"}
                            </button>
                        </div>
                    </div>

                        {hasSensors ? (
                            sensorDefinitionsToRender.map((sensor) => { // Use the filtered list for rendering
                                const SensorComponent = sensor.component;
                                return (
                                    <div
                                        key={sensor.name} // Use sensor.name for key
                                        className={`aqua-sensor-card ${sensor.cssClass}`}
                                        onClick={() => openSensorModal(sensor)}
                                    >
                                        {/* Pass deviceId down to sensor components */}
                                        <SensorComponent theme={theme} filter={filter} deviceId={deviceId} />
                                    </div>
                                );
                            })
                        ) : (
                            !isLoadingSensors && <p>No sensors associated with your device found, or an error occurred.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* The Modal Component */}
            {selectedSensorForModal && (
                <div className="aqua-modal-overlay" onClick={closeSensorModal}>
                    <div className="aqua-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="aqua-modal-close-btn" onClick={closeSensorModal}>X</button>
                        <h2>{selectedSensorForModal.name} History</h2>
                        {/* Render the selected sensor component inside the modal */}
                        <selectedSensorForModal.component theme={theme} filter={filter} isModal={true} deviceId={deviceId} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Export the renamed component
export default UserHistory;