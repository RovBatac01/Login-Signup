import React, { useContext, useState } from "react";
import Sidebar from "../components/Sidebar"; // Adjusted path
import PageTitle from "../components/PageTitle";
import "../styles/Pages Css/History.css"; // Adjusted path
import Temp from "../sensors/temp"; // Adjusted path
import PhLevel from "../sensors/phlevel"; // Adjusted path
import Turbidity from "../sensors/turbudity"; // Adjusted path
import Tds from "../sensors/Tds"; // Adjusted path
import Sal from "../sensors/sal"; // Adjusted path
import Conductivity from "../sensors/Conductivity"; // Adjusted path
import ElectricalConductivity from "../sensors/ElectricalConductivity"; // Adjusted path
import "../styles/theme.css"; // Adjusted path
import { ThemeContext } from "../context/ThemeContext"; // Adjusted path
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { exportToPdf, savePdf } from "../utils/pdfExport";
import { AuthContext } from '../context/AuthContext'; // Adjusted path

const History = () => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    const { user } = useContext(AuthContext); // Get user from AuthContext
    const establishmentId = user ? user.establishmentId : null; // Safely get establishmentId

    const [filter, setFilter] = useState("24h");
    const [exporting, setExporting] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [selectedSensorForModal, setSelectedSensorForModal] = useState(null);

    const sensorDefinitions = [
        { name: "Temperature", tableName: "temperature_readings", valueColumn: "temperature_celsius", apiPath: "/temperature", component: Temp, cssClass: "aqua-water-temperature-container" },
        { name: "pH Level", tableName: "phlevel_readings", valueColumn: "ph_value", apiPath: "/phlevel", component: PhLevel, cssClass: "aqua-ph-level-container" },
        { name: "Turbidity", tableName: "turbidity_readings", valueColumn: "turbidity_value", apiPath: "/turbidity", component: Turbidity, cssClass: "aqua-turbidity-container" },
        { name: "TDS", tableName: "tds_readings", valueColumn: "tds_value", apiPath: "/tds", component: Tds, cssClass: "aqua-tds-container" },
        { name: "Salinity", tableName: "salinity_readings", valueColumn: "salinity_value", apiPath: "/salinity", component: Sal, cssClass: "aqua-salinity-container" },
        { name: "Conductivity", tableName: "ec_readings", valueColumn: "ec_value_mS", apiPath: "/ec", component: Conductivity, cssClass: "aqua-conductivity-container" },
        { name: "Electrical Conductivity", tableName: "ec_compensated_readings", valueColumn: "ec_compensated_mS", apiPath: "/ec-compensated", component: ElectricalConductivity, cssClass: "aqua-electrical-conductivity-container" },
    ];

    const openSensorModal = (sensorData) => {
        setSelectedSensorForModal(sensorData);
    };

    const closeSensorModal = () => {
        setSelectedSensorForModal(null);
    };

    // Fetch data from the backend based on the filter
    const fetchSensorData = async () => {
        let dataToExport = {};

        const filterToEndpoint = {
            "realtime": "realtime",
            "24h": "24h",
            "7d": "7d-avg",
            "30d": "30d-avg",
        };

        const backendFilter = filterToEndpoint[filter];
        if (!backendFilter) {
            alert("Invalid filter selected for export. This should not happen if buttons are correctly configured.");
            return null;
        }

        // Fetch data for each sensor
        for (const sensor of sensorDefinitions) {
            // Append establishmentId as a query parameter only if it exists
            let endpoint = `https://login-signup-3470.onrender.com/data${sensor.apiPath}/${backendFilter}`;
            if (establishmentId) {
                endpoint += `?establishmentId=${establishmentId}`;
            }
            console.log(`Fetching data for ${sensor.name} from: ${endpoint}`);

            const response = await fetch(endpoint);
            if (!response.ok) {
                const errorText = await response.text(); // Get raw error response
                throw new Error(`Failed to fetch ${sensor.name} data: ${response.statusText} (${response.status}). Details: ${errorText}`);
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
            alert("No data available for export based on the selected filter. Check your database or filter criteria.");
            return null;
        }

        return dataToExport;
    };

    // Export to Excel function
    const exportToExcel = async () => {
        setExporting(true);
        
        try {
            const dataToExport = await fetchSensorData();
            if (!dataToExport) {
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

        } catch (error) {
            console.error("Error exporting Excel:", error);
            alert(`Error exporting data: ${error.message}. Check browser console for details.`);
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
            case "pH Level": return "pH";
            case "TDS": return "ppm";
            case "Salinity": return "ppt";
            case "Conductivity": return "mS/cm";
            case "Electrical Conductivity": return "mS/cm";
            case "Temperature": return "°C";
            default: return "";
        }
    };

    return (
        <div className={`aqua-history-page ${theme}`}>
            <div className="aqua-history-container">
                <Sidebar theme={theme} toggleTheme={toggleTheme} />

                <div className="aqua-history-content-wrapper">
                    <PageTitle title="SENSOR HISTORY" />

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

                    <div className="aqua-history-sensors-grid">
                        {sensorDefinitions.map((sensor) => {
                            const SensorComponent = sensor.component;
                            return (
                                <div
                                    key={sensor.name}
                                    className={`aqua-sensor-card ${sensor.cssClass}`}
                                    onClick={() => openSensorModal(sensor)}
                                >
                                    {/* Pass the current filter state and establishmentId to each sensor component */}
                                    <SensorComponent theme={theme} filter={filter} establishmentId={establishmentId} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedSensorForModal && (
                <div className="aqua-modal-overlay" onClick={closeSensorModal}>
                    <div className="aqua-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="aqua-modal-close-btn" onClick={closeSensorModal}>×</button>
                        <h2>{selectedSensorForModal.name} History</h2>
                        <selectedSensorForModal.component theme={theme} filter={filter} isModal={true} establishmentId={establishmentId} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;