// EstablishmentSensors.jsx (with improved modal UI)
import React, { useState, useContext } from 'react';
import '../styles/Components Css/Establishment-enhanced.css';
import { ThemeContext } from '../context/ThemeContext';

// Import all sensor components
import Turbidity from "../DashboardMeters/Turbidity";
import Ph from "../DashboardMeters/Ph";
import Tds from "../DashboardMeters/Tds";
import Conductivity from "../DashboardMeters/Conductivity";
import Salinity from "../DashboardMeters/Salinity";
import Temperature from "../DashboardMeters/Temperature";
import ElectricalCon from "../DashboardMeters/ElectricalCon";

// Import Font Awesome for icons
import '@fortawesome/fontawesome-free/css/all.min.css';

// IMPORTANT: Map sensor names to their corresponding React components
const sensorComponentMap = {
  // Standard naming
  "Turbidity": Turbidity,
  "ph Level": Ph,
  "Total Dissolved Solids": Tds,
  "Conductivity": Conductivity,
  "Salinity": Salinity,
  "Temperature": Temperature,
  "Electrical Conductivity": ElectricalCon,

  // Alternative naming variations
  "Turbidity Sensor": Turbidity,
  "pH Sensor": Ph,
  "TDS Sensor": Tds,
  "Conductivity Sensor": Conductivity,
  "Salinity Sensor": Salinity,
  "Temperature Sensor A": Temperature,
  "Electrical Conductivity (Compensated)": ElectricalCon,

  // Placeholder mappings
  "Humidity Sensor B": null,
  "CO2 Sensor C": null,
  "Light Sensor D": null,
  "Motion Sensor E": null,
};

const EstablishmentSensors = ({ establishment, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useContext(ThemeContext);

  // Destructure data from the establishment object
  const { name: establishmentName, sensors, device_id } = establishment;
  
  // Ensure sensors is always an array
  const safeSensors = Array.isArray(sensors) ? sensors : [];

  return (
    <div className="estab-sensors-wrapper">
      <div className="estab-sensors-container">
        <div className="estab-info">
          <h2 className="estab-name">{establishmentName}</h2>
          <div className="estab-meta">
            <span className="badge sensor-count-badge">
              <i className="fas fa-microchip"></i> {safeSensors.length} Sensors
            </span>
            {device_id && (
              <span className="badge device-id-badge">
                <i className="fas fa-tablet-alt"></i> ID: {device_id}
              </span>
            )}
          </div>
        </div>
        
        <div className="estab-actions">
          <button onClick={() => setIsOpen(true)} className="estab-details-button">
            <i className="fas fa-info-circle"></i> Details
          </button>
          <button
            onClick={() => onDelete(establishment.id, establishment.name)}
            className="estab-delete-icon-button"
            title={`Delete ${establishmentName}`}
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
        
        {isOpen && (
          <div className="estab-modal">
            <div className="estab-modal-content">
              <div className="estab-modal-header">
                <button onClick={() => setIsOpen(false)} className="estab-modal-close-button">
                  <i className="fas fa-times"></i>
                </button>
                <h2 className="estab-modal-title">{establishmentName}</h2>
                <div className="estab-modal-meta">
                  <span className="badge sensor-count-badge">
                    <i className="fas fa-microchip"></i> {safeSensors.length} Sensors
                  </span>
                  {device_id && (
                    <span className="badge device-id-badge">
                      <i className="fas fa-tablet-alt"></i> Device ID: {device_id}
                    </span>
                  )}
                </div>
              </div>

              <div className="estab-sensor-list">
                {safeSensors.length > 0 ? (
                  safeSensors.map((sensor) => {
                    console.log(`Processing sensor: ID=${sensor.id}, Name="${sensor.name}"`);

                    const SensorComponent = sensorComponentMap[sensor.name];
                    if (SensorComponent) {
                      return (
                        <div key={sensor.id} className="estab-sensor-card">
                          <div className="estab-sensor-header">
                            <h3 className="estab-sensor-name">{sensor.name}</h3>
                          </div>
                          <div className="estab-sensor-body">
                            <SensorComponent />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={sensor.id} className="estab-sensor-card missing-component">
                          <div className="estab-sensor-header">
                            <h3 className="estab-sensor-name">{sensor.name}</h3>
                          </div>
                          <div className="estab-sensor-body">
                            <div className="missing-sensor-placeholder">
                              <i className="fas fa-exclamation-triangle"></i>
                              <p>No dedicated display component available</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })
                ) : (
                  <div className="no-sensors-container">
                    <i className="fas fa-exclamation-circle no-sensors-icon"></i>
                    <p className="no-sensors-message">No sensors currently assigned to this establishment</p>
                  </div>
                )}
              </div>

              <div className="estab-modal-footer">
                <button onClick={() => setIsOpen(false)} className="estab-modal-close-button-bottom">
                  <i className="fas fa-times-circle"></i> Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EstablishmentSensors;
