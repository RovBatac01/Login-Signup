import React, { useState, useEffect } from 'react';
import styles from '../styles/Components Css/AddEstablishmentForm.module.css';

const AddEstablishmentForm = ({ onClose, onEstablishmentAdded }) => {
  const [newEstablishmentName, setNewEstablishmentName] = useState("");
  const [allSensors, setAllSensors] = useState([]);
  const [selectedSensors, setSelectedSensors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Helper Function to Generate Device ID ---
  const generateDeviceId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // Fetch all sensors when component mounts
  useEffect(() => {
    fetchAllSensors();
  }, []);

  const fetchAllSensors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found. Please log in.");
        return;
      }

      const response = await fetch('http://localhost:5000/api/sensors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, text: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      const data = await response.json();
      setAllSensors(data);
    } catch (error) {
      console.error("Failed to fetch all sensors:", error);
      setAllSensors([]);
    }
  };

  const addEstablishmentToDatabase = async (name, sensors, deviceId) => {
    try {
      const response = await fetch('http://localhost:5000/api/establishments', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, sensors, device_id: deviceId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error adding establishment:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      const responseData = await response.json();
      console.log('Establishment added successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error("Failed to add establishment:", error);
      throw error;
    }
  };

  const handleInputChange = (event) => {
    setNewEstablishmentName(event.target.value);
  };

  const handleSensorCheckboxChange = (sensorId) => {
    setSelectedSensors((prevSelectedSensors) =>
      prevSelectedSensors.includes(sensorId)
        ? prevSelectedSensors.filter((id) => id !== sensorId)
        : [...prevSelectedSensors, sensorId]
    );
  };

  const handleAddEstablishment = async () => {
    if (newEstablishmentName.trim() === "") {
      alert("Please enter an establishment name.");
      return;
    }

    if (selectedSensors.length === 0) {
      alert("Please select at least one sensor.");
      return;
    }

    setIsSubmitting(true);
    try {
      const newDeviceId = generateDeviceId();
      await addEstablishmentToDatabase(newEstablishmentName, selectedSensors, newDeviceId);
      
      // Notify parent component that establishment was added
      if (onEstablishmentAdded) {
        onEstablishmentAdded();
      }
      
      // Close the form
      onClose();
    } catch (error) {
      alert("Failed to add establishment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewEstablishmentName("");
    setSelectedSensors([]);
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalContent}>
          <div className={styles.formHeader}>
            <h4><i className="fas fa-building"></i> Create New Establishment</h4>
            <button onClick={handleCancel} className={styles.closeButton}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label htmlFor="establishment-name">Establishment Name</label>
              <input
                id="establishment-name"
                type="text"
                placeholder="Enter establishment name (e.g., Kitchen Sink, Lab Station)"
                value={newEstablishmentName}
                onChange={handleInputChange}
                className={styles.formInput}
                disabled={isSubmitting}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>
                <i className="fas fa-microchip"></i> Select Sensors 
                <span className={styles.selectedCount}>
                  ({selectedSensors.length} selected)
                </span>
              </label>
              <div className={styles.sensorCheckboxGrid}>
                {allSensors.length > 0 ? (
                  allSensors.map((sensor) => (
                    <div key={sensor.id} className={styles.sensorCheckboxItem}>
                      <input
                        type="checkbox"
                        id={`sensor-${sensor.id}`}
                        value={sensor.id}
                        checked={selectedSensors.includes(sensor.id)}
                        onChange={() => handleSensorCheckboxChange(sensor.id)}
                        className={styles.checkboxInput}
                        disabled={isSubmitting}
                      />
                      <label htmlFor={`sensor-${sensor.id}`} className={styles.checkboxLabel}>
                        <span className={styles.sensorIcon}>
                          <i className="fas fa-dot-circle"></i>
                        </span>
                        <span className={styles.sensorName}>{sensor.sensor_name}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className={styles.noSensorsMessage}>
                    <i className="fas fa-exclamation-circle"></i>
                    <p>No sensors available. Please add sensors first.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={styles.formFooter}>
            <button 
              onClick={handleAddEstablishment} 
              className={styles.addButton}
              disabled={!newEstablishmentName.trim() || selectedSensors.length === 0 || isSubmitting}
            >
              <i className="fas fa-check"></i> 
              {isSubmitting ? 'Creating...' : 'Create Establishment'}
            </button>
            <button 
              onClick={handleCancel} 
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEstablishmentForm;
