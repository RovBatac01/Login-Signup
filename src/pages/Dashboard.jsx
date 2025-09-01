import React, { useContext, useState, useEffect } from "react";
import Navbar from "../components/Navbar"; // Assuming Navbar exists and is used elsewhere
import Sidebar from "../components/Sidebar";
import PageTitle from "../components/PageTitle";
import styles from "../styles/Pages Css/Dashboard.module.css";
import { ThemeContext } from "../context/ThemeContext";
import DashboardPage from "../components/DashboardPage"; // This component holds the total stats
import EstablishmentSensors, { sensorComponentMap } from "../components/DashboardEstablishment-UI"; // Improved UI version
import CalendarComponent from "../components/CalendarComponent"; // Import Calendar Component
import WaterQualityInfoModal from "../components/WaterQualityInfoModal"; // Import the new Water Quality Info Modal
import InfoButton from "../components/InfoButton"; // Import the Info Button component
import io from 'socket.io-client'; // Import socket.io-client

// Initialize Socket.IO connection here, or import from a dedicated socket.js file
import socket from '../DashboardMeters/socket'; // Assuming 'socket.js' is in '../components'

const Dashboard = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEstablishmentName, setNewEstablishmentName] = useState("");
  const [establishments, setEstablishments] = useState([]); // Now stores full establishment objects
  const [loading, setLoading] = useState(true); // Add loading state
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [allSensors, setAllSensors] = useState([]); // Renamed from availableSensors
  const [selectedSensors, setSelectedSensors] = useState([]); // New state for selected sensors
  const [selectedEstablishmentModal, setSelectedEstablishmentModal] = useState(null); // State for the full-screen modal

  // --- States for the Global Warning Pop-up ---
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningTitle, setWarningTitle] = useState('⚠️ Water Quality Alert!');
  
  // --- State for Water Quality Info Modal ---
  const [showWaterQualityInfo, setShowWaterQualityInfo] = useState(false);
  const [activeParameter, setActiveParameter] = useState('overview');  // --- Helper Function to Generate Device ID ---
  const generateDeviceId = () => {
    return Math.floor(10000 + Math.random() * 90000).toString();
  };

  // --- Database Interaction ---
  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      // IMPORTANT: Ensure your backend's /api/establishments endpoint
      // now fetches and includes ALL associated sensors for each establishment.
      const response = await fetch('https://login-signup-3470.onrender.com/api/establishments');
      console.log('Frontend - HTTP Response Status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Frontend - HTTP Error fetching establishments:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      const data = await response.json();
      console.log('Frontend - Data received from backend:', data);
      setEstablishments(data);
    } catch (error) {
      console.error("Frontend - Failed to fetch establishments (catch block):", error);
      setEstablishments([]);
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED: This function now fetches ALL sensors, not just "available" ones.
  const fetchAllSensors = async () => { // Renamed function
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("No authentication token found. Please log in.");
        return;
      }

      // MODIFIED: Change the endpoint to fetch all sensors
      const response = await fetch('https://login-signup-3470.onrender.com/api/sensors', { // Assuming /api/sensors gives all
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
      setAllSensors(data); // Storing in new state variable
    } catch (error) {
      console.error("Failed to fetch all sensors:", error);
      setAllSensors([]);
    }
  };

  const addEstablishmentToDatabase = async (name, sensors, deviceId) => {
    try {
      const response = await fetch('https://login-signup-3470.onrender.com/api/establishments', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // The `sensors` array here is crucial for the backend to create many-to-many links
        body: JSON.stringify({ name, sensors, device_id: deviceId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error adding establishment:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      const responseData = await response.json();
      console.log('Establishment added successfully:', responseData);
      await fetchEstablishments(); // Re-fetch establishments to update the list
    } catch (error) {
      console.error("Failed to add establishment:", error);
    }
  };

  const handleDeleteEstablishment = async (establishmentId, establishmentName) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${establishmentName}"? This action cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`https://login-signup-3470.onrender.com/api/establishments/${establishmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error deleting establishment ${establishmentId}:`, response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }

      console.log(`Establishment ${establishmentId} deleted successfully.`);
      await fetchEstablishments(); // Re-fetch establishments to update the list
    } catch (error) {
      console.error("Failed to delete establishment:", error);
    }
  };

  // --- Effect Hooks ---

  // Fetch establishments when the component mounts
  useEffect(() => {
    fetchEstablishments();
  }, []);

  // Fetch all sensors when the add form is shown
  useEffect(() => {
    if (showAddForm) {
      fetchAllSensors(); // Call the new function
    }
  }, [showAddForm]);

  // --- Socket.IO Listener for Global Notifications ---
  useEffect(() => {
    const handleNewNotification = (notification) => {
      console.log('Dashboard received new notification:', notification);
      
      const cleanedMessage = notification.message.replace('⚠️ Alert: ', '');
      
      setWarningMessage(`${cleanedMessage} Please take actions now.`);
      setShowWarningPopup(true); // Show the pop-up
    };

    socket.on('newNotification', handleNewNotification);

    return () => {
      socket.off('newNotification', handleNewNotification);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  // --- Event Handlers ---
  const handleAddButtonClick = () => {
    setShowAddForm(true);
    setSelectedSensors([]);
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
    if (newEstablishmentName.trim() !== "") {
      const newDeviceId = generateDeviceId();
      await addEstablishmentToDatabase(newEstablishmentName, selectedSensors, newDeviceId);
      setNewEstablishmentName("");
      setSelectedSensors([]);
      setShowAddForm(false);
    } else {
      console.warn("Please enter an establishment name.");
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewEstablishmentName("");
    setSelectedSensors([]);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Handler for showing establishment details in full screen modal
  const handleShowEstablishmentModal = (establishment) => {
    setSelectedEstablishmentModal(establishment);
  };

  // Handler for closing the full screen modal
  const handleCloseEstablishmentModal = () => {
    setSelectedEstablishmentModal(null);
  };

  // --- Filtered Establishments ---
  const filteredEstablishments = establishments.filter((establishment) => {
    if (!establishment || typeof establishment.name !== 'string') {
      return false;
    }
    return establishment.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  console.log('Dashboard - Current establishments state:', establishments);
  console.log('Dashboard - Filtered establishments (before render):', filteredEstablishments);

  return (
    <div className={`${styles.db} ${theme}`}>
      <div className={styles.dbContainer}>
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <div className={styles.dbContents}>
          {/* Dashboard Metrics Section */}
          <div className={styles.meterRowFlex}>
            <DashboardPage />
            <div className={styles.infoButtonContainer}>
              <InfoButton onClick={() => setShowWaterQualityInfo(true)} text="Water Quality Information" />
            </div>
          </div>
          
          {/* Main Content Area: Establishments List and Calendar */}
          <div className={styles.mainContentGrid}>
            {/* Establishment Management Section */}
            <div className={styles.establishmentSection}>
              <div className={styles.sectionHeader}>
                <h3>Establishments</h3>
                {!showAddForm && (
                  <button onClick={handleAddButtonClick} className={styles.addEstablishmentButton}>
                    + Add New Establishment
                  </button>
                )}
              </div>
              {showAddForm && (
                <div className={styles.addEstablishmentForm}>
                  <input
                    type="text"
                    placeholder="Enter establishment name"
                    value={newEstablishmentName}
                    onChange={handleInputChange}
                  />
                  <div className="option-sensors">
                    <h4>Select Sensors:</h4>
                    {allSensors.map((sensor) => (
                      <div key={sensor.id} className={styles.sensorCheckboxItem}>
                        <input
                          type="checkbox"
                          id={`sensor-${sensor.id}`}
                          value={sensor.id}
                            checked={selectedSensors.includes(sensor.id)}
                            onChange={() => handleSensorCheckboxChange(sensor.id)}
                          />
                          <label htmlFor={`sensor-${sensor.id}`}>
                            {sensor.sensor_name}
                            {/* Removed (Assigned) / (Available) distinction based on device_id */}
                            {/* If you want to show if it's assigned to *any* other estab,
                              you'd need the backend to provide this info for each sensor */}
                          </label>
                        </div>
                      ))}
                    </div>
                  {/* MODIFIED: Use allSensors here */}
                  {allSensors.length === 0 && (
                    <div className={styles.noSensorsMessage}>No sensors available to add.</div>
                  )}
                  <div className={styles.formButtons}>
                    <button onClick={handleAddEstablishment} className={styles.addButton}>Add</button>
                    <button onClick={handleCancelAdd} className={styles.cancelButton}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Search Bar */}
              <div className={styles.searchBarContainer}>
                <input
                  type="text"
                  placeholder="Search establishments..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={styles.searchBar}
                />
              </div>

              <div className={styles.establishmentsList}>
                {loading ? (
                  <div className={styles.loadingMessage}>Loading establishments...</div>
                ) : filteredEstablishments.length === 0 ? (
                  <div className={styles.noEstablishmentsMessage}>No establishments found matching your search.</div>
                ) : (
                  filteredEstablishments.map((establishment) => (
                    <EstablishmentSensors
                      key={establishment.id}
                      establishment={establishment}
                      onDelete={handleDeleteEstablishment}
                      onShowModal={handleShowEstablishmentModal}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Calendar Section */}
            <div className={styles.calendarSection}>
              <CalendarComponent />
            </div>
          </div>
        </div>
      </div>

      {/* Global Pop-up Warning Notification (Centered on Screen) */}
      {showWarningPopup && (
        <div className="warning-popup"> {/* Ensure you have this class in your CSS */}
          <div className="popup-content"> {/* Ensure you have this class in your CSS */}
            <h3>{warningTitle}</h3>
            <p>{warningMessage}</p>
            <button onClick={() => setShowWarningPopup(false)} className="close-popup">
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Water Quality Information Modal */}
      <WaterQualityInfoModal 
        isOpen={showWaterQualityInfo} 
        onClose={() => setShowWaterQualityInfo(false)}
        activeParameter={activeParameter}
      />

      {/* Full Screen Establishment Modal */}
      {selectedEstablishmentModal && (
        <div className="estab-modal">
          <div className="estab-modal-content">
            <div className="estab-modal-header">
              <button onClick={handleCloseEstablishmentModal} className="estab-modal-close-button">
                <i className="fas fa-times"></i>
              </button>
              <h2 className="estab-modal-title">{selectedEstablishmentModal.name}</h2>
              <div className="estab-modal-meta">
                <span className="badge sensor-count-badge">
                  <i className="fas fa-microchip"></i> {
                    Array.isArray(selectedEstablishmentModal.sensors) 
                      ? selectedEstablishmentModal.sensors.length 
                      : 0
                  } Sensors
                </span>
                {selectedEstablishmentModal.device_id && (
                  <span className="badge device-id-badge">
                    <i className="fas fa-tablet-alt"></i> Device ID: {selectedEstablishmentModal.device_id}
                  </span>
                )}
              </div>
            </div>

            <div className="estab-sensor-list">
              {Array.isArray(selectedEstablishmentModal.sensors) && selectedEstablishmentModal.sensors.length > 0 ? (
                selectedEstablishmentModal.sensors.map((sensor) => {
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
              <button onClick={handleCloseEstablishmentModal} className="estab-modal-close-button-bottom">
                <i className="fas fa-times-circle"></i> Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
