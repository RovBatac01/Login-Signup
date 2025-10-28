import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../components/Sidebar";
import PageTitle from "../components/PageTitle";
import styles from "../styles/Pages Css/EstablishmentManagement.module.css";
import "../styles/theme.css";
import { ThemeContext } from "../context/ThemeContext";
import AddEstablishmentForm from "../components/AddEstablishmentForm";
import { Card } from "react-bootstrap";
import { Building2, Microchip, Search } from "lucide-react";

const EstablishmentManagement = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [showAddForm, setShowAddForm] = useState(false);
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Fetch Establishments ---
  const fetchEstablishments = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/establishments');
      console.log('EstablishmentManagement - HTTP Response Status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('EstablishmentManagement - HTTP Error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }
      const data = await response.json();
      console.log('EstablishmentManagement - Data received:', data);
      setEstablishments(data);
    } catch (error) {
      console.error("EstablishmentManagement - Failed to fetch establishments:", error);
      setEstablishments([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Establishment ---
  const handleDeleteEstablishment = async (establishmentId, establishmentName) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete "${establishmentName}"? This action cannot be undone.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/establishments/${establishmentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error deleting establishment ${establishmentId}:`, response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText}`);
      }

      console.log(`Establishment ${establishmentId} deleted successfully.`);
      await fetchEstablishments(); // Re-fetch establishments
    } catch (error) {
      console.error("Failed to delete establishment:", error);
      alert("Failed to delete establishment. Please try again.");
    }
  };

  // --- Effect: Fetch establishments on mount ---
  useEffect(() => {
    fetchEstablishments();
  }, []);

  // --- Event Handlers ---
  const handleAddButtonClick = () => {
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
  };

  const handleEstablishmentAdded = () => {
    fetchEstablishments(); // Re-fetch after adding
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // --- Filtered Establishments ---
  const filteredEstablishments = establishments.filter((establishment) => {
    if (!establishment || typeof establishment.name !== 'string') {
      return false;
    }
    return establishment.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`${styles.establishment} ${theme}`}>
      <div className={styles.establishmentContainer}>
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        
        <div className={styles.establishmentContents}>
          {/* Page Title */}
          <PageTitle title="ESTABLISHMENT MANAGEMENT" />

          {/* Statistics Cards */}
          <div className={styles.statsRow}>
            <Card className={`${styles.statCard} ${theme}`}>
              <Card.Body>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <Building2 size={32} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{establishments.length}</h3>
                    <p className={styles.statLabel}>Total Establishments</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <Card className={`${styles.statCard} ${theme}`}>
              <Card.Body>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <Microchip size={32} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>
                      {establishments.reduce((total, est) => 
                        total + (Array.isArray(est.sensors) ? est.sensors.length : 0), 0
                      )}
                    </h3>
                    <p className={styles.statLabel}>Total Sensors</p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card className={`${styles.statCard} ${theme}`}>
              <Card.Body>
                <div className={styles.statCardContent}>
                  <div className={styles.statIcon}>
                    <Search size={32} />
                  </div>
                  <div className={styles.statInfo}>
                    <h3 className={styles.statValue}>{filteredEstablishments.length}</h3>
                    <p className={styles.statLabel}>Search Results</p>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Action Row: Add Button and Search Bar */}
          <div className={styles.actionRow}>
            <button onClick={handleAddButtonClick} className={styles.addButton}>
              <i className="fas fa-plus-circle"></i> Add Establishment
            </button>
            
            <div className={styles.searchWrapper}>
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search establishments by name..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className={styles.clearButton}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className={styles.scrollableContent}>
            {/* Establishments Table */}
            <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Establishments List</h2>
              <span className={styles.resultCount}>
                {filteredEstablishments.length} {filteredEstablishments.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading establishments...</p>
              </div>
            ) : filteredEstablishments.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-inbox"></i>
                <h3>No Establishments Found</h3>
                <p>
                  {searchQuery 
                    ? `No establishments match "${searchQuery}". Try a different search term.`
                    : "Get started by adding your first establishment using the button above."}
                </p>
                {!searchQuery && (
                  <button onClick={handleAddButtonClick} className={styles.emptyStateButton}>
                    <i className="fas fa-plus"></i> Add Your First Establishment
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Device ID</th>
                      <th>Sensors</th>
                      <th>Sensor Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEstablishments.map((establishment) => (
                      <tr key={establishment.id}>
                        <td className={styles.idCell}>{establishment.id}</td>
                        <td className={styles.nameCell}>
                          <div className={styles.nameCellContent}>
                            <i className="fas fa-building"></i>
                            <span className={styles.establishmentName}>{establishment.name}</span>
                          </div>
                        </td>
                        <td className={styles.deviceCell}>
                          {establishment.device_id ? (
                            <span className={styles.deviceBadge}>
                              <i className="fas fa-tablet-alt"></i> {establishment.device_id}
                            </span>
                          ) : (
                            <span className={styles.noDevice}>N/A</span>
                          )}
                        </td>
                        <td className={styles.countCell}>
                          <span className={styles.sensorCount}>
                            {Array.isArray(establishment.sensors) ? establishment.sensors.length : 0}
                          </span>
                        </td>
                        <td className={styles.sensorsCell}>
                          {Array.isArray(establishment.sensors) && establishment.sensors.length > 0 ? (
                            <div className={styles.sensorTags}>
                              {establishment.sensors.map((sensor) => (
                                <span key={sensor.id} className={styles.sensorTag}>
                                  {sensor.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={styles.noSensors}>No sensors assigned</span>
                          )}
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            onClick={() => handleDeleteEstablishment(establishment.id, establishment.name)}
                            className={styles.deleteButton}
                            title="Delete establishment"
                          >
                            <i className="fas fa-trash-alt"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Establishment Form Modal */}
      {showAddForm && (
        <AddEstablishmentForm 
          onClose={handleCloseAddForm}
          onEstablishmentAdded={handleEstablishmentAdded}
        />
      )}
    </div>
  );
};

export default EstablishmentManagement;
