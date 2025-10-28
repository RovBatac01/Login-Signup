import React, { useContext, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
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
  const [establishments, setEstablishments] = useState([]); // Now stores full establishment objects
  const [loading, setLoading] = useState(true); // Add loading state
  const [selectedEstablishmentModal, setSelectedEstablishmentModal] = useState(null); // State for the full-screen modal

  // --- States for the Global Warning Pop-up ---
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningTitle, setWarningTitle] = useState('⚠️ Water Quality Alert!');
  
  // --- State for Water Quality Info Modal ---
  const [showWaterQualityInfo, setShowWaterQualityInfo] = useState(false);
  const [activeParameter, setActiveParameter] = useState('overview');

  // --- Database Interaction ---
  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/establishments');
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

  // --- Effect Hooks ---

  // Fetch establishments when the component mounts
  useEffect(() => {
    fetchEstablishments();
  }, []);

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
  const handleShowEstablishmentModal = (establishment) => {
    setSelectedEstablishmentModal(establishment);
  };

  const handleCloseEstablishmentModal = () => {
    setSelectedEstablishmentModal(null);
  };

  console.log('Dashboard - Current establishments state:', establishments);

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
                <div className={styles.sectionTitleWithCount}>
                  <h3>Establishments</h3>
                  <span className={styles.countBadge}>{establishments.length}</span>
                </div>
              </div>

              <div className={styles.establishmentsList}>
                {loading ? (
                  <div className={styles.loadingMessage}>Loading establishments...</div>
                ) : establishments.length === 0 ? (
                  <div className={styles.noEstablishmentsMessage}>
                    No establishments available. Visit Establishment Management to add one.
                  </div>
                ) : (
                  establishments.map((establishment) => (
                    <EstablishmentSensors
                      key={establishment.id}
                      establishment={establishment}
                      onShowModal={handleShowEstablishmentModal}
                      viewOnly={true}
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
