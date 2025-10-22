import React, { useContext, useState } from "react";
import Sidebar from "../components/Sidebar"; // Adjusted path
import PageTitle from "../components/PageTitle";
import "../styles/Pages Css/History.css"; // Adjusted path
import Temp from "../sensors/temp"; // Adjusted path
import PhLevel from "../sensors/phlevel"; // Adjusted path
import Turbidity from "../sensors/turbudity"; // Adjusted path
import PortableTurbidity from "../sensors/turbidity2"; // Portable Turbidity sensor
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
    
    const [filter, setFilter] = useState("24h");
    const [exporting, setExporting] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [selectedSensorForModal, setSelectedSensorForModal] = useState(null);
    
    // New states for establishment selection
    const [establishments, setEstablishments] = useState([]);
    const [selectedEstablishment, setSelectedEstablishment] = useState(null);
    const [establishmentSensors, setEstablishmentSensors] = useState([]);
    const [loading, setLoading] = useState(true);

    const sensorDefinitions = [
        { name: "Temperature", tableName: "temperature_readings", valueColumn: "temperature_celsius", apiPath: "/temperature", component: Temp, cssClass: "aqua-water-temperature-container" },
        { name: "pH Level", tableName: "phlevel_readings", valueColumn: "ph_value", apiPath: "/phlevel", component: PhLevel, cssClass: "aqua-ph-level-container" },
        { name: "Turbidity", tableName: "turbidity_readings", valueColumn: "turbidity_value", apiPath: "/turbidity", component: Turbidity, cssClass: "aqua-turbidity-container" },
        { name: "Portable Turbidity", tableName: "turbidity2_readings", valueColumn: "turbidity2_value", apiPath: "/turbidity2", component: PortableTurbidity, cssClass: "aqua-turbidity-container" },
        { name: "TDS", tableName: "tds_readings", valueColumn: "tds_value", apiPath: "/tds", component: Tds, cssClass: "aqua-tds-container" },
        { name: "Salinity", tableName: "salinity_readings", valueColumn: "salinity_value", apiPath: "/salinity", component: Sal, cssClass: "aqua-salinity-container" },
        { name: "Conductivity", tableName: "ec_readings", valueColumn: "ec_value_mS", apiPath: "/ec", component: Conductivity, cssClass: "aqua-conductivity-container" },
        { name: "Electrical Conductivity", tableName: "ec_compensated_readings", valueColumn: "ec_compensated_mS", apiPath: "/ec-compensated", component: ElectricalConductivity, cssClass: "aqua-electrical-conductivity-container" },
    ];

    // Fetch establishments on component mount
    React.useEffect(() => {
        const fetchEstablishments = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/establishments', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch establishments');
                }
                
                const data = await response.json();
                setEstablishments(data);
                
                // Auto-select establishment based on user role
                if (user?.role === 'User' && user?.establishmentId) {
                    // For regular users, auto-select their establishment
                    const userEstablishment = data.find(est => est.id === user.establishmentId);
                    if (userEstablishment) {
                        setSelectedEstablishment(userEstablishment);
                    }
                } else if (user?.role === 'Admin' && user?.establishmentId) {
                    // For admins, auto-select their establishment
                    const adminEstablishment = data.find(est => est.id === user.establishmentId);
                    if (adminEstablishment) {
                        setSelectedEstablishment(adminEstablishment);
                    }
                } else if (data.length > 0) {
                    // For Super Admin or if no specific establishment, select first one
                    setSelectedEstablishment(data[0]);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching establishments:', error);
                setLoading(false);
            }
        };
        
        fetchEstablishments();
    }, [user]);

    // Update establishment sensors when selected establishment changes
    React.useEffect(() => {
        if (selectedEstablishment && selectedEstablishment.sensors) {
            console.log('🏢 Selected Establishment:', selectedEstablishment.name);
            console.log('📊 Sensors from Database:', selectedEstablishment.sensors);
            console.log('📋 Available Sensor Definitions:', sensorDefinitions.map(s => s.name));
            
            // Create a more precise sensor matching function
            const matchSensor = (dbSensorName, sensorDefName) => {
                const normalize = (str) => str.toLowerCase().trim();
                const dbName = normalize(dbSensorName);
                const defName = normalize(sensorDefName);
                
                // Exact match first
                if (dbName === defName) {
                    console.log(`  ✓ Exact match: "${dbSensorName}" = "${sensorDefName}"`);
                    return true;
                }
                
                // Specific sensor name mappings to prevent false positives
                // ORDER MATTERS: Check more specific terms BEFORE generic ones
                const sensorMappings = {
                    'electrical conductivity': ['electrical conductivity', 'electrical conductivity (compensated)', 'ec compensated', 'ec'],
                    'portable turbidity': ['portable turbidity', 'portable turbidity sensor', 'turbidity2', 'turbidity 2'],
                    'temperature': ['temperature', 'temperature sensor a', 'temp sensor'],
                    'ph level': ['ph', 'ph level', 'ph sensor', 'phlevel'],
                    'turbidity': ['turbidity', 'turbidity sensor'],
                    'tds': ['tds', 'total dissolved solids', 'tds sensor'],
                    'salinity': ['salinity', 'salinity sensor', 'sal'],
                    'conductivity': ['conductivity', 'conductivity sensor', 'cond']
                };
                
                // Check if database sensor matches any alias of the sensor definition
                for (const [sensorKey, aliases] of Object.entries(sensorMappings)) {
                    // Only match if the sensorDefName matches the key
                    if (defName === sensorKey) {
                        // Check if dbName matches any of the aliases for this sensor type
                        const matches = aliases.some(alias => {
                            const normalizedAlias = normalize(alias);
                            
                            // For "turbidity", explicitly exclude "portable turbidity"
                            if (sensorKey === 'turbidity') {
                                if (dbName.includes('portable')) {
                                    return false; // Don't match "Portable Turbidity" to "Turbidity"
                                }
                            }
                            
                            // For "portable turbidity", must contain "portable"
                            if (sensorKey === 'portable turbidity') {
                                if (!dbName.includes('portable') && !dbName.includes('turbidity2') && !dbName.includes('turbidity 2')) {
                                    return false; // Don't match plain "Turbidity" to "Portable Turbidity"
                                }
                            }
                            
                            // For "conductivity", explicitly exclude "electrical conductivity"
                            if (sensorKey === 'conductivity') {
                                if (dbName.includes('electrical')) {
                                    return false; // Don't match "Electrical Conductivity" to "Conductivity"
                                }
                            }
                            
                            // For "electrical conductivity", must contain "electrical"
                            if (sensorKey === 'electrical conductivity') {
                                if (!dbName.includes('electrical')) {
                                    return false; // Don't match plain "Conductivity" to "Electrical Conductivity"
                                }
                            }
                            
                            // Exact alias match or db name contains the alias
                            return dbName === normalizedAlias || 
                                   (normalizedAlias.length > 2 && dbName.includes(normalizedAlias));
                        });
                        
                        if (matches) {
                            console.log(`  ✓ Alias match: "${dbSensorName}" matches "${sensorDefName}"`);
                            return true;
                        }
                    }
                }
                
                console.log(`  ✗ No match: "${dbSensorName}" ≠ "${sensorDefName}"`);
                return false;
            };
            
            // Map establishment sensors to sensor definitions with precise matching
            const availableSensors = [];
            const matchedDbSensors = new Set(); // Track which DB sensors we've already matched
            const unmatchedDbSensors = [];
            
            sensorDefinitions.forEach(sensorDef => {
                const matchingDbSensors = selectedEstablishment.sensors.filter(sensor => {
                    // Skip if we've already matched this DB sensor
                    if (matchedDbSensors.has(sensor.id)) return false;
                    
                    return matchSensor(sensor.name, sensorDef.name);
                });
                
                if (matchingDbSensors.length > 0) {
                    availableSensors.push(sensorDef);
                    // Mark these DB sensors as matched
                    matchingDbSensors.forEach(s => matchedDbSensors.add(s.id));
                }
            });
            
            // Find unmatched sensors
            selectedEstablishment.sensors.forEach(sensor => {
                if (!matchedDbSensors.has(sensor.id)) {
                    unmatchedDbSensors.push(sensor);
                }
            });
            
            console.log('✅ Final Available Sensors:', availableSensors.map(s => s.name));
            console.log('📈 Total Sensors Count:', availableSensors.length, '(Expected:', selectedEstablishment.sensors.length, ')');
            
            if (unmatchedDbSensors.length > 0) {
                console.warn('⚠️ UNMATCHED SENSORS FROM DATABASE:', unmatchedDbSensors);
                console.warn('These sensors exist in the database but have no matching component definition!');
            }
            
            setEstablishmentSensors(availableSensors);
        } else {
            setEstablishmentSensors([]);
        }
    }, [selectedEstablishment]);

    const handleEstablishmentChange = (event) => {
        const establishmentId = parseInt(event.target.value);
        const establishment = establishments.find(est => est.id === establishmentId);
        setSelectedEstablishment(establishment);
    };

    const openSensorModal = (sensorData) => {
        setSelectedSensorForModal(sensorData);
    };

    const closeSensorModal = () => {
        setSelectedSensorForModal(null);
    };

    // Fetch data from the backend based on the filter
    const fetchSensorData = async () => {
        if (!selectedEstablishment) {
            alert("Please select an establishment first.");
            return null;
        }

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

        // Fetch data only for sensors that the establishment has
        for (const sensor of establishmentSensors) {
            // Append establishmentId as a query parameter
            let endpoint = `http://localhost:5000/data${sensor.apiPath}/${backendFilter}?establishmentId=${selectedEstablishment.id}`;
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
            const establishmentName = selectedEstablishment?.name || "Unknown Establishment";
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
            case "Portable Turbidity": return "NTU";
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

                    {/* Combined Controls Row */}
                    <div className="aqua-history-controls">
                        {/* Filter Buttons */}
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

                        {/* Establishment Selector */}
                        <div className="aqua-establishment-selector-inline">
                            <select
                                id="establishment-select"
                                value={selectedEstablishment?.id || ''}
                                onChange={handleEstablishmentChange}
                                disabled={loading || (user?.role === 'User' && user?.establishmentId)}
                            >
                                {loading ? (
                                    <option>Loading...</option>
                                ) : establishments.length === 0 ? (
                                    <option>No establishments</option>
                                ) : (
                                    establishments.map((est) => (
                                        <option key={est.id} value={est.id}>
                                            {est.name} ({est.sensor_count || est.sensors?.length || 0} sensors)
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div className="aqua-export-buttons">
                            <button onClick={exportToExcel} className="aqua-export-btn excel-btn" disabled={exporting || exportingPdf || !selectedEstablishment}>
                                {exporting ? "Exporting..." : "Export Excel"}
                            </button>
                            <button onClick={exportToPDF} className="aqua-export-btn pdf-btn" disabled={exporting || exportingPdf || !selectedEstablishment}>
                                {exportingPdf ? "Exporting..." : "Export PDF"}
                            </button>
                        </div>
                    </div>

                    {/* Establishment Info Badges */}
                    {selectedEstablishment && (
                        <div className="aqua-establishment-info">
                            <span className="badge">
                                <i className="fas fa-microchip"></i> {establishmentSensors.length} Active Sensors
                            </span>
                            <span className="badge">
                                <i className="fas fa-tablet-alt"></i> Device: {selectedEstablishment.device_id}
                            </span>
                        </div>
                    )}

                    {loading ? (
                        <div className="aqua-loading-message">
                            <i className="fas fa-spinner fa-spin"></i> Loading establishments...
                        </div>
                    ) : !selectedEstablishment ? (
                        <div className="aqua-no-establishment-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>Please select an establishment to view sensor history</p>
                        </div>
                    ) : establishmentSensors.length === 0 ? (
                        <div className="aqua-no-sensors-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>No sensors available for this establishment</p>
                        </div>
                    ) : (
                        <div className="aqua-history-sensors-grid">
                            {establishmentSensors.map((sensor) => {
                                const SensorComponent = sensor.component;
                                return (
                                    <div
                                        key={sensor.name}
                                        className={`aqua-sensor-card ${sensor.cssClass}`}
                                        onClick={() => openSensorModal(sensor)}
                                    >
                                        {/* Pass the current filter state and selectedEstablishment ID to each sensor component */}
                                        <SensorComponent 
                                            theme={theme} 
                                            filter={filter} 
                                            establishmentId={selectedEstablishment.id} 
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedSensorForModal && selectedEstablishment && (
                <div className="aqua-modal-overlay" onClick={closeSensorModal}>
                    <div className="aqua-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="aqua-modal-close-btn" onClick={closeSensorModal}>×</button>
                        <h2>{selectedSensorForModal.name} History - {selectedEstablishment.name}</h2>
                        <selectedSensorForModal.component 
                            theme={theme} 
                            filter={filter} 
                            isModal={true} 
                            establishmentId={selectedEstablishment.id} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;