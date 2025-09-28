import React, { useContext, useState, useEffect } from "react";
import Navbar from "../components/Navbar"; 
import Sidebar from "../components/Sidebar";
import "../styles/Pages Css/AdminHistory.css"; 
import Temp from "../sensors/temp";
import PhLevel from "../sensors/phlevel";
import Turbidity from "../sensors/turbudity";
import Tds from "../sensors/Tds";
import Sal from "../sensors/sal";
import Conductivity from "../sensors/Conductivity";
import ElectricalConductivity from "../sensors/ElectricalConductivity";
import "../styles/theme.css";
import { ThemeContext } from "../context/ThemeContext";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { AuthContext } from '../context/AuthContext';
import PageTitle from "../components/PageTitle";
import { exportToPdf, savePdf } from "../utils/pdfExport";


const AdminHistory = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { currentUser } = useContext(AuthContext);

    // State to hold the dynamically fetched establishment ID
    const [establishmentId, setEstablishmentId] = useState(null); // Initialize as null

    const [filter, setFilter] = useState("24h");
    const [exporting, setExporting] = useState(false);
    const [selectedSensorForModal, setSelectedSensorForModal] = useState(null);
    const [message, setMessage] = useState('');
    const [exportingPdf, setExportingPdf] = useState(false);
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'

    // State to hold the dynamically fetched list of available sensors for the establishment
    const [establishmentSensors, setEstablishmentSensors] = useState([]);
    const [isLoadingSensors, setIsLoadingSensors] = useState(true);

    // Define all possible sensors
    const allSensorDefinitions = [
        { name: "Turbidity", tableName: "turbidity_readings", valueColumn: "turbidity_value", apiPath: "/turbidity", component: Turbidity, cssClass: "aqua-turbidity-container" },
        { name: "ph Level", tableName: "phlevel_readings", valueColumn: "ph_value", apiPath: "/phlevel", component: PhLevel, cssClass: "aqua-ph-level-container" },
        { name: "Total Dissolved Solids", tableName: "tds_readings", valueColumn: "tds_value", apiPath: "/tds", component: Tds, cssClass: "aqua-tds-container" },
        { name: "Salinity", tableName: "salinity_readings", valueColumn: "salinity_value", apiPath: "/salinity", component: Sal, cssClass: "aqua-salinity-container" },
        { name: "Conductivity", tableName: "ec_readings", valueColumn: "ec_value_mS", apiPath: "/ec", component: Conductivity, cssClass: "aqua-conductivity-container" },
        { name: "Electrical Conductivity", tableName: "ec_compensated_readings", valueColumn: "ec_compensated_mS", apiPath: "/ec-compensated", component: ElectricalConductivity, cssClass: "aqua-electrical-conductivity-container" },
        { name: "Temperature", tableName: "temperature_readings", valueColumn: "temperature_celsius", apiPath: "/temperature", component: Temp, cssClass: "aqua-water-temperature-container" },
    ];

    // Combined Effect to get the establishment ID and fetch associated sensors
    useEffect(() => {
        let currentEstablishmentId = null;

        // Attempt to get establishment ID from AuthContext first
        if (currentUser && currentUser.establishmentId) {
            currentEstablishmentId = currentUser.establishmentId;
            console.log("Establishment ID from AuthContext:", currentEstablishmentId);
        } else {
            // Fallback to localStorage if not found in AuthContext
            const storedEstablishmentId = localStorage.getItem('establishmentId');
            if (storedEstablishmentId) {
                currentEstablishmentId = storedEstablishmentId;
                console.log("Establishment ID from localStorage:", currentEstablishmentId);
            }
        }

        // Update the state variable `establishmentId`
        setEstablishmentId(currentEstablishmentId);

        // Define the sensor fetching function inside the useEffect for closure over `currentEstablishmentId`
        const fetchEstablishmentSensors = async (id) => {
            if (!id) {
                setMessage('No establishment ID found. Cannot load sensor data.');
                setMessageType('error');
                setIsLoadingSensors(false);
                return; // Exit if no valid ID
            }

            setIsLoadingSensors(true);
            setMessage(''); // Clear previous messages
            setMessageType('');

            try {
                // Fetch list of sensors for the establishment using the determined ID
                const response = await fetch(`http://localhost:5000/api/establishment/${id}/sensors`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch establishment sensors: ${response.statusText}`);
                }
                const data = await response.json();
                // Assuming data is an array of objects like [{ name: "Salinity" }]
                // or simply an array of strings ["Salinity", "Temperature"]
                const sensorNames = data.map(sensor => sensor.name || sensor); // Adjust based on your backend response structure
                setEstablishmentSensors(sensorNames);
                console.log("Fetched establishment sensors:", sensorNames);
            } catch (error) {
                console.error("Error fetching establishment sensors:", error);
                setMessage(`Failed to load sensors for establishment: ${error.message}`);
                setMessageType('error');
                setEstablishmentSensors([]); // Clear any previous sensors on error
            } finally {
                setIsLoadingSensors(false);
            }
        };

        // Only call fetchEstablishmentSensors if we have a valid ID
        if (currentEstablishmentId) {
            fetchEstablishmentSensors(currentEstablishmentId);
        } else {
            // If no establishment ID could be found, stop loading
            setIsLoadingSensors(false);
        }

    }, [currentUser]); // Re-run this effect when currentUser changes (e.g., after login)

    // Filter sensorDefinitions based on the fetched establishmentSensors
    // This will re-evaluate whenever establishmentSensors state changes
    const sensorDefinitions = allSensorDefinitions.filter(sensor =>
        establishmentSensors.includes(sensor.name)
    );
    console.log("Filtered sensor definitions (for rendering):", sensorDefinitions);


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

        // Ensure establishmentId is available
        if (!establishmentId) {
            setMessage('Cannot export: Establishment ID is missing.');
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

            // Fetch data ONLY for the filtered sensors that are associated with the establishment
            for (const sensor of sensorDefinitions) { // Use the filtered sensorDefinitions here
                const endpoint = `http://localhost:5000/data${sensor.apiPath}/${backendFilter}?establishmentId=${establishmentId}`;
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
                setMessage('No data available for export based on the selected filter and establishment.');
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

    const getSensorUnit = (sensorName) => {
        switch (sensorName) {
            case "Turbidity": return "NTU";
            case "pH Level": return "pH";
            case "Total Dissolved Solids": return "ppm"; // Changed from "TDS" to "Total Dissolved Solids" to match definition
            case "Salinity": return "ppt";
            case "Conductivity": return "mS/cm";
            case "Electrical Conductivity": return "mS/cm";
            case "Temperature": return "°C";
            default: return "";
        }
    };

    // Function to fetch sensor data for PDF export
    const fetchSensorData = async () => {
        setMessage('');
        setMessageType('');

        // Ensure establishmentId is available
        if (!establishmentId) {
            setMessage('Cannot export: Establishment ID is missing.');
            setMessageType('error');
            return null;
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
                return null;
            }

            let dataToExport = {};

            // Fetch data ONLY for the filtered sensors that are associated with the establishment
            for (const sensor of sensorDefinitions) {
                const endpoint = `http://localhost:5000/data${sensor.apiPath}/${backendFilter}?establishmentId=${establishmentId}`;
                console.log(`Fetching data for ${sensor.name} from: ${endpoint}`);
                
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${sensor.name} data: ${response.statusText}`);
                }
                const data = await response.json();

                const formattedSensorData = data.map(item => ({
                    Timestamp: new Date(item.timestamp).toLocaleString(),
                    Value: parseFloat(item.value),
                    Unit: getSensorUnit(sensor.name),
                    sensorName: sensor.name
                }));
                
                dataToExport[sensor.name] = formattedSensorData;
            }

            const hasData = Object.values(dataToExport).some(arr => arr.length > 0);
            if (!hasData) {
                setMessage('No data available for export based on the selected filter and establishment.');
                setMessageType('error');
                return null;
            }

            return dataToExport;

        } catch (error) {
            console.error("Error fetching sensor data:", error);
            setMessage(`Error fetching data: ${error.message}`);
            setMessageType('error');
            return null;
        }
    };

    // Export to PDF function
    const exportToPDF = async () => {
        setExportingPdf(true);
        setMessage('');
        setMessageType('');
        
        try {
            const dataToExport = await fetchSensorData();
            if (!dataToExport) {
                setExportingPdf(false);
                return;
            }

            // Generate PDF using our utility function
            const establishmentName = currentUser?.establishmentName || "Unknown Establishment";
            const pdfBlob = exportToPdf(dataToExport, filter, establishmentName);
            
            // Save the PDF
            savePdf(pdfBlob, filter, establishmentName);
            console.log("PDF file exported successfully.");
            setMessage('PDF file exported successfully!');
            setMessageType('success');

        } catch (error) {
            console.error("Error exporting PDF:", error);
            setMessage(`Error exporting PDF: ${error.message}`);
            setMessageType('error');
        } finally {
            setExportingPdf(false);
        }
    };

    if (isLoadingSensors) {
        return (
            <div className={`aqua-history-page ${theme}`}>
                <div className="aqua-history-container">
                    <Sidebar theme={theme} toggleTheme={toggleTheme} />
                    <div className="aqua-history-content-wrapper">
                        <PageTitle title="SENSOR HISTORY" />
                        <div className="aqua-history-loading">
                            <p>Loading sensors for establishment...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`aqua-history-page ${theme}`}>
            <div className="aqua-history-container">
                <Sidebar theme={theme} toggleTheme={toggleTheme} />

                <div className="aqua-history-content-wrapper">
                    {/* Replace h1 with PageTitle component */}
                    <PageTitle title="SENSOR HISTORY" />
                    
                    {message && (
                        <div className={`settings-page-message-box ${messageType === 'success' ? 'settings-page-message-success' : 'settings-page-message-error'}`}>
                            {message}
                        </div>
                    )}

                    {/* Filter buttons */}
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

                    {/* Sensors Grid */}
                    <div className="aqua-history-sensors-grid">
                        {sensorDefinitions.length > 0 ? (
                            sensorDefinitions.map((sensor) => {
                                const SensorComponent = sensor.component;
                                return (
                                    <div
                                        key={sensor.name}
                                        className={`aqua-sensor-card ${sensor.cssClass}`}
                                        onClick={() => openSensorModal(sensor)}
                                    >
                                        {/* Pass establishmentId down to sensor components */}
                                        <SensorComponent theme={theme} filter={filter} establishmentId={establishmentId} />
                                    </div>
                                );
                            })
                        ) : (
                            // Only show this message if not loading and no sensors found
                            !isLoadingSensors && (
                                <div className="aqua-no-sensors-message">
                                    <p>No sensors associated with this establishment found, or an error occurred.</p>
                                </div>
                            )
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
                        <selectedSensorForModal.component theme={theme} filter={filter} isModal={true} establishmentId={establishmentId} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHistory;