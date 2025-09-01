import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/Components Css/WaterQualityInfo.css';

// Import images
import categoryImg from '../assets/Categtory.png';
import basisImg from '../assets/basis.png';
import basisOfSafetyScoreImg from '../assets/basisOfSafetyScore.png';
import safetyScoreImg from '../assets/safetyScore.png';

const WaterQualityInfoModal = ({ isOpen, onClose, activeParameter = 'overview' }) => {
  const { theme } = useContext(ThemeContext);
  const [currentTab, setCurrentTab] = useState(activeParameter);
  const [expandedImage, setExpandedImage] = useState(null);
  
  const handleImageClick = (imageSrc, altText) => {
    setExpandedImage({ src: imageSrc, alt: altText });
  };

  const closeExpandedImage = () => {
    setExpandedImage(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="wq-modal">
      <div className={`wq-modal-content ${theme}`}>
        <div className="wq-modal-header">
          <h2 className="wq-modal-title">Water Quality Parameters</h2>
          <button onClick={onClose} className="wq-modal-close-button">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="wq-modal-body">
          <div className="wq-tabs">
            <button 
              className={`wq-tab ${currentTab === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`wq-tab ${currentTab === 'ph' ? 'active' : ''}`}
              onClick={() => setCurrentTab('ph')}
            >
              pH Level
            </button>
            <button 
              className={`wq-tab ${currentTab === 'turbidity' ? 'active' : ''}`}
              onClick={() => setCurrentTab('turbidity')}
            >
              Turbidity
            </button>
            <button 
              className={`wq-tab ${currentTab === 'tds' ? 'active' : ''}`}
              onClick={() => setCurrentTab('tds')}
            >
              TDS
            </button>
            <button 
              className={`wq-tab ${currentTab === 'conductivity' ? 'active' : ''}`}
              onClick={() => setCurrentTab('conductivity')}
            >
              Conductivity
            </button>
            <button 
              className={`wq-tab ${currentTab === 'salinity' ? 'active' : ''}`}
              onClick={() => setCurrentTab('salinity')}
            >
              Salinity
            </button>
            <button 
              className={`wq-tab ${currentTab === 'temperature' ? 'active' : ''}`}
              onClick={() => setCurrentTab('temperature')}
            >
              Temperature
            </button>
            <button 
              className={`wq-tab ${currentTab === 'electrical' ? 'active' : ''}`}
              onClick={() => setCurrentTab('electrical')}
            >
              Electrical Conductivity
            </button>
          </div>
          
          <div className="wq-tab-content">
            {currentTab === 'overview' && (
              <div className="wq-overview">
                {/* NEW: Color Legend Section */}
                <div className="wq-color-legend">
                  <h3>Water Quality Color Indicators</h3>
                  <p>Our system uses color coding to quickly communicate water quality status:</p>
                  
                  <div className="wq-quality-indicators">
                    <div className="wq-quality-indicator excellent">
                      <div className="indicator-color"></div>
                      <div className="indicator-details">
                        <h4>Green - Excellent/Safe</h4>
                        <p>Parameters are within optimal range. Water is safe for intended use.</p>
                      </div>
                    </div>
                    
                    <div className="wq-quality-indicator good">
                      <div className="indicator-color"></div>
                      <div className="indicator-details">
                        <h4>Light Green - Good</h4>
                        <p>Parameters in acceptable range. Minor treatment may be required.</p>
                      </div>
                    </div>
                    
                    <div className="wq-quality-indicator moderate">
                      <div className="indicator-color"></div>
                      <div className="indicator-details">
                        <h4>Yellow - Moderate/Caution</h4>
                        <p>Parameters approaching critical levels. Treatment recommended.</p>
                      </div>
                    </div>
                    
                    <div className="wq-quality-indicator poor">
                      <div className="indicator-color"></div>
                      <div className="indicator-details">
                        <h4>Red - Critical/Poor</h4>
                        <p>Parameters outside safe ranges. Immediate action required.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="wq-intro">
                  <h3>Water Quality Monitoring System</h3>
                  <p>Our comprehensive water quality monitoring system measures key parameters that indicate the health and safety of water sources. These measurements help ensure water is suitable for its intended use, whether for drinking, agriculture, or environmental conservation.</p>
                  
                  <div className="wq-parameter-image">
                    <img 
                      src={categoryImg} 
                      alt="Water Quality Categories" 
                      className="wq-info-image" 
                      onClick={() => handleImageClick(categoryImg, "Water Quality Parameters and Categories")}
                      style={{ cursor: 'pointer' }}
                    />
                    <p className="wq-image-caption">Water Quality Parameters and Categories</p>
                  </div>
                  
                  <div className="wq-importance">
                    <h4>Why Water Quality Matters</h4>
                    <p>Clean water is essential for human health, ecosystems, and sustainable development. Regular monitoring helps detect pollution, prevent waterborne diseases, and protect aquatic life.</p>
                  </div>

                  <div className="wq-standard-table">
                    <h4>Philippine National Standards for Drinking Water (PNSDW)</h4>
                    <table className="wq-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Maximum Allowable Level (MAL)</th>
                          <th>Methods of Analysis</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Turbidity</td>
                          <td>5 NTU</td>
                          <td>2130 B. Nephelometric Method</td>
                        </tr>
                        <tr>
                          <td>pH</td>
                          <td>6.5 – 8.5</td>
                          <td>4500-H+ B. Electrometric Method</td>
                        </tr>
                        <tr>
                          <td>Total Dissolved Solids</td>
                          <td>600 mg/L</td>
                          <td>2540 C. Total Dissolved Solids Dried at 180°C</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="wq-parameters-grid">
                  {/* Parameter Cards */}
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-flask"></i>
                    </div>
                    <h4>pH Level</h4>
                    <p>Measures acidity/alkalinity (0-14)</p>
                    <div className="wq-range">
                      <span className="wq-range-bad">0</span>
                      <span className="wq-range-optimal">7</span>
                      <span className="wq-range-bad">14</span>
                    </div>
                    <p className="wq-optimal">Optimal: 6.5-8.5</p>
                  </div>
                  
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-water"></i>
                    </div>
                    <h4>Turbidity</h4>
                    <p>Water clarity (NTU units)</p>
                    <div className="wq-range">
                      <span className="wq-range-optimal">0</span>
                      <span className="wq-range-caution">5</span>
                      <span className="wq-range-bad">10+</span>
                    </div>
                    <p className="wq-optimal">Optimal: &lt;1 NTU</p>
                  </div>
                  
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-tint"></i>
                    </div>
                    <h4>TDS</h4>
                    <p>Total Dissolved Solids (mg/L)</p>
                    <div className="wq-range">
                      <span className="wq-range-optimal">0</span>
                      <span className="wq-range-caution">500</span>
                      <span className="wq-range-bad">1000+</span>
                    </div>
                    <p className="wq-optimal">Optimal: &lt;500 mg/L</p>
                  </div>
                  
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-bolt"></i>
                    </div>
                    <h4>Conductivity</h4>
                    <p>Electrical conductance (μS/cm)</p>
                    <div className="wq-range">
                      <span className="wq-range-optimal">0</span>
                      <span className="wq-range-caution">1000</span>
                      <span className="wq-range-bad">2000+</span>
                    </div>
                    <p className="wq-optimal">Optimal: 200-800 μS/cm</p>
                  </div>
                  
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-water"></i>
                    </div>
                    <h4>Salinity</h4>
                    <p>Salt content (ppt)</p>
                    <div className="wq-range">
                      <span className="wq-range-optimal">0</span>
                      <span className="wq-range-caution">0.5</span>
                      <span className="wq-range-bad">1.0+</span>
                    </div>
                    <p className="wq-optimal">Freshwater: &lt;0.5 ppt</p>
                  </div>
                  
                  <div className="wq-parameter-card">
                    <div className="wq-parameter-icon">
                      <i className="fas fa-thermometer-half"></i>
                    </div>
                    <h4>Temperature</h4>
                    <p>Water temperature (°C)</p>
                    <div className="wq-range">
                      <span className="wq-range-bad">0</span>
                      <span className="wq-range-optimal">25</span>
                      <span className="wq-range-bad">40+</span>
                    </div>
                    <p className="wq-optimal">Optimal: 20-30°C</p>
                  </div>
                </div>
                
                <div className="wq-computation-info">
                  <h3>How Measurements Are Computed</h3>
                  <p>Our system uses specialized sensors that convert physical or chemical properties of water into electrical signals. These signals are then processed by our algorithms to provide accurate readings of each parameter.</p>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <img 
                          src={basisImg} 
                          alt="Measurement Basis" 
                          className="wq-info-image" 
                          onClick={() => handleImageClick(basisImg, "Basis of Water Quality Measurements")}
                          style={{ cursor: 'pointer' }}
                        />
                        <p className="wq-image-caption">Basis of Water Quality Measurements</p>
                      </div>
                      <div className="wq-image-container">
                        <img 
                          src={basisOfSafetyScoreImg} 
                          alt="Safety Score Basis" 
                          className="wq-info-image" 
                          onClick={() => handleImageClick(basisOfSafetyScoreImg, "Basis of Water Safety Scoring")}
                          style={{ cursor: 'pointer' }}
                        />
                        <p className="wq-image-caption">Basis of Water Safety Scoring</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="wq-parameter-image">
                    <img 
                      src={safetyScoreImg} 
                      alt="Water Safety Score" 
                      className="wq-info-image" 
                      onClick={() => handleImageClick(safetyScoreImg, "Water Safety Score Interpretation")}
                      style={{ cursor: 'pointer' }}
                    />
                    <p className="wq-image-caption">Water Safety Score Interpretation</p>
                  </div>
                  
                  <div className="wq-computation-steps">
                    <div className="wq-step">
                      <div className="wq-step-number">1</div>
                      <div className="wq-step-content">
                        <h4>Data Collection</h4>
                        <p>Sensors immersed in water collect raw electrical signals</p>
                      </div>
                    </div>
                    <div className="wq-step">
                      <div className="wq-step-number">2</div>
                      <div className="wq-step-content">
                        <h4>Signal Processing</h4>
                        <p>Microcontrollers convert signals to digital readings</p>
                      </div>
                    </div>
                    <div className="wq-step">
                      <div className="wq-step-number">3</div>
                      <div className="wq-step-content">
                        <h4>Calibration & Adjustment</h4>
                        <p>Readings are adjusted based on calibration factors</p>
                      </div>
                    </div>
                    <div className="wq-step">
                      <div className="wq-step-number">4</div>
                      <div className="wq-step-content">
                        <h4>Data Transmission</h4>
                        <p>Processed readings are sent to the monitoring system</p>
                      </div>
                    </div>
                    <div className="wq-step">
                      <div className="wq-step-number">5</div>
                      <div className="wq-step-content">
                        <h4>Analysis & Display</h4>
                        <p>Data is analyzed for trends and displayed in the dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'ph' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-flask"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>pH Level</h3>
                    <p>Measures acidity or alkalinity of water</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>pH is a measure of how acidic or alkaline water is. The pH scale ranges from 0 to 14, with 7 being neutral. Values below 7 indicate acidity, while values above 7 indicate alkalinity.</p>
                  
                  {/* Placeholder for pH Scale image */}
                  <div className="wq-parameter-image">
                    <div className="wq-image-placeholder">
                      <i className="fas fa-flask"></i>
                      <p>pH Scale Image</p>
                    </div>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For drinking water, the optimal pH range is 6.5-8.5. Water outside this range may taste metallic or bitter and can damage plumbing.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses a pH electrode that generates a small voltage proportional to the hydrogen ion concentration in the water. This voltage is converted to a pH reading using the Nernst equation:</p>
                  
                  <div className="wq-formula">
                    <p>E = E° - (2.303RT/nF) * pH</p>
                    <p><small>Where E is the measured voltage, E° is a reference voltage, R is the gas constant, T is temperature in Kelvin, n is the valence of ions, and F is the Faraday constant.</small></p>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-danger">Acidic (pH &lt; 6.5)</h5>
                      <p>Can leach metals from plumbing, bitter taste, harmful to aquatic life</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-success">Neutral (pH 6.5-8.5)</h5>
                      <p>Optimal for drinking water and aquatic life</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Alkaline (pH &gt; 8.5)</h5>
                      <p>Scaling in pipes, soapy taste, eye irritation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'turbidity' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-water"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Turbidity</h3>
                    <p>Measures clarity and particulate matter in water</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Turbidity is a measure of water clarity or cloudiness. It indicates the concentration of suspended particles in water that reduce its transparency by scattering and absorbing light.</p>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <div className="wq-image-placeholder">
                          <i className="fas fa-tint"></i>
                          <p>Low Turbidity Water</p>
                        </div>
                        <p className="wq-image-caption">Low Turbidity (&lt;1 NTU)</p>
                      </div>
                      <div className="wq-image-container">
                        <div className="wq-image-placeholder">
                          <i className="fas fa-tint-slash"></i>
                          <p>High Turbidity Water</p>
                        </div>
                        <p className="wq-image-caption">High Turbidity (&gt;10 NTU)</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For drinking water, the WHO recommends turbidity of less than 1 NTU, and ideally below 0.2 NTU for effective disinfection.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses a nephelometric sensor that measures the intensity of light scattered by particles in the water. The unit of measurement is Nephelometric Turbidity Units (NTU).</p>
                  
                  <div className="wq-parameter-image">
                    <div className="wq-image-placeholder">
                      <i className="fas fa-water"></i>
                      <p>Turbidity Sensor Diagram</p>
                    </div>
                    <p className="wq-image-caption">Turbidity sensor working principle</p>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-success">Low Turbidity (&lt;1 NTU)</h5>
                      <p>Clear water, effective disinfection possible, suitable for drinking</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Moderate Turbidity (1-5 NTU)</h5>
                      <p>Slightly cloudy, may require additional filtration before disinfection</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">High Turbidity (&gt;5 NTU)</h5>
                      <p>Visibly cloudy water, impairs disinfection, may harbor pathogens, affects aquatic life</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'tds' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-tint"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Total Dissolved Solids (TDS)</h3>
                    <p>Measures the concentration of dissolved substances in water</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Total Dissolved Solids (TDS) refers to the total concentration of dissolved substances in water. These include salts, minerals, metals, cations or anions that are smaller than 2 microns in size.</p>
                  
                  <div className="wq-parameter-image">
                    <div className="wq-image-placeholder">
                      <i className="fas fa-tint"></i>
                      <p>TDS Level Comparison</p>
                    </div>
                    <p className="wq-image-caption">Comparison of water with different TDS levels</p>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For drinking water, the EPA recommends TDS levels below 500 mg/L. Water with TDS levels below 300 mg/L is considered excellent.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses electrical conductivity to estimate TDS. Since dissolved solids increase water's ability to conduct electricity, we can calculate TDS using the formula:</p>
                  
                  <div className="wq-formula">
                    <p>TDS (mg/L) = EC (μS/cm) × conversion factor</p>
                    <p><small>The conversion factor typically ranges from 0.5 to 0.7 depending on the composition of dissolved solids.</small></p>
                  </div>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <div className="wq-image-placeholder">
                          <i className="fas fa-tint"></i>
                          <p>TDS Meter</p>
                        </div>
                        <p className="wq-image-caption">TDS Measurement Device</p>
                      </div>
                      <div className="wq-image-container">
                        <div className="wq-image-placeholder">
                          <i className="fas fa-chart-bar"></i>
                          <p>TDS Chart</p>
                        </div>
                        <p className="wq-image-caption">TDS Classification Chart</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-success">Low TDS (&lt;300 mg/L)</h5>
                      <p>Excellent water quality, suitable for drinking, may taste flat</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Moderate TDS (300-500 mg/L)</h5>
                      <p>Good water quality, acceptable for drinking, may have mineral taste</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">High TDS (&gt;1000 mg/L)</h5>
                      <p>Poor water quality, unpleasant taste, may cause scaling in pipes, unsuitable for many applications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'conductivity' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Conductivity</h3>
                    <p>Measures water's ability to conduct electrical current</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Conductivity measures water's ability to conduct an electrical current. It's directly related to the concentration of ions (dissolved salts) in the water.</p>
                  
                  <div className="wq-parameter-image">
                    <div className="wq-image-placeholder">
                      <i className="fas fa-bolt"></i>
                      <p>Conductivity Measurement Principle</p>
                    </div>
                    <p className="wq-image-caption">Principle of conductivity measurement in water</p>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For freshwater, typical conductivity ranges from 200 to 800 μS/cm. Drinking water usually ranges from 50 to 1500 μS/cm.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses a conductivity probe with two electrodes. An alternating current is applied between the electrodes, and the resulting voltage is measured to determine conductivity.</p>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/conductivity-sensor.jpg" alt="Conductivity Sensor" className="wq-info-image" />
                        <p className="wq-image-caption">Conductivity sensor</p>
                      </div>
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/conductivity-chart.jpg" alt="Conductivity Ranges" className="wq-info-image" />
                        <p className="wq-image-caption">Conductivity ranges for different water types</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-success">Low Conductivity (&lt;200 μS/cm)</h5>
                      <p>Indicates very pure water with few dissolved salts, typical of rainwater or distilled water</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Normal Conductivity (200-800 μS/cm)</h5>
                      <p>Typical for most freshwater sources, suitable for most uses</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">High Conductivity (&gt;1500 μS/cm)</h5>
                      <p>Indicates high salt content, may be unsuitable for irrigation or drinking, can indicate pollution</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'salinity' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-water"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Salinity</h3>
                    <p>Measures the salt content in water</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Salinity is a measure of the salt concentration in water. It's particularly important for agricultural applications and aquatic ecosystems.</p>
                  
                  <div className="wq-parameter-image">
                    <img src="/src/assets/water-quality/salinity-effects.jpg" alt="Effects of Salinity" className="wq-info-image" />
                    <p className="wq-image-caption">Effects of different salinity levels on plants and aquatic life</p>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For freshwater ecosystems, salinity should be less than 0.5 ppt. For drinking water, salinity should be less than 0.2 ppt.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system derives salinity from conductivity measurements using standard conversion formulas. Salinity can be expressed in parts per thousand (ppt), practical salinity units (PSU), or percentage.</p>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/salinity-types.jpg" alt="Water Types by Salinity" className="wq-info-image" />
                        <p className="wq-image-caption">Classification of water types by salinity</p>
                      </div>
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/salinity-measurement.jpg" alt="Salinity Measurement" className="wq-info-image" />
                        <p className="wq-image-caption">Methods of salinity measurement</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-success">Freshwater (&lt;0.5 ppt)</h5>
                      <p>Suitable for drinking, irrigation, and freshwater organisms</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Brackish Water (0.5-30 ppt)</h5>
                      <p>Mixture of freshwater and seawater, limited agricultural use, specific ecosystem requirements</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">Seawater (&gt;30 ppt)</h5>
                      <p>Unsuitable for drinking or irrigation, requires desalination for most uses</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'temperature' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-thermometer-half"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Temperature</h3>
                    <p>Measures the thermal condition of water</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Water temperature affects oxygen levels, chemical processes, and the health of aquatic organisms. It's a critical parameter that influences many other water quality factors.</p>
                  
                  <div className="wq-parameter-image">
                    <img src="/src/assets/water-quality/temperature-effects.jpg" alt="Temperature Effects" className="wq-info-image" />
                    <p className="wq-image-caption">Effects of temperature on aquatic ecosystems</p>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For most freshwater ecosystems, temperatures between 20°C and 30°C are optimal. Different aquatic species have different temperature requirements.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses waterproof digital temperature sensors (typically thermistors or RTDs) that provide accurate readings across a wide temperature range.</p>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/temperature-sensor.jpg" alt="Temperature Sensor" className="wq-info-image" />
                        <p className="wq-image-caption">Water temperature sensor</p>
                      </div>
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/temperature-chart.jpg" alt="Temperature Effects Chart" className="wq-info-image" />
                        <p className="wq-image-caption">Temperature effects on dissolved oxygen and aquatic life</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-danger">Low Temperature (&lt;10°C)</h5>
                      <p>Slows biological activity, increases oxygen solubility, can stress tropical species</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-success">Moderate Temperature (20-30°C)</h5>
                      <p>Optimal for most aquatic life, balanced metabolic rates</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">High Temperature (&gt;35°C)</h5>
                      <p>Reduces dissolved oxygen, increases metabolism, can be lethal for many species</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {currentTab === 'electrical' && (
              <div className="wq-parameter-detail">
                <div className="wq-parameter-header">
                  <div className="wq-parameter-icon large">
                    <i className="fas fa-bolt"></i>
                  </div>
                  <div className="wq-parameter-title">
                    <h3>Electrical Conductivity (EC)</h3>
                    <p>Measures water's ability to conduct electrical current with temperature compensation</p>
                  </div>
                </div>
                
                <div className="wq-parameter-description">
                  <p>Electrical Conductivity (EC) is similar to conductivity but includes temperature compensation to provide standardized measurements regardless of water temperature.</p>
                  
                  <div className="wq-parameter-image">
                    <img src="/src/assets/water-quality/ec-principle.jpg" alt="EC Measurement Principle" className="wq-info-image" />
                    <p className="wq-image-caption">Principle of EC measurement with temperature compensation</p>
                  </div>
                  
                  <h4>Optimal Range</h4>
                  <p>For irrigation water, EC below 0.75 dS/m is considered excellent. For drinking water, the range is typically 0.05 to 1.5 dS/m.</p>
                  
                  <h4>How It's Measured</h4>
                  <p>Our system uses a conductivity probe with an integrated temperature sensor. The raw conductivity reading is adjusted using the formula:</p>
                  
                  <div className="wq-formula">
                    <p>EC₂₅ = EC_T / [1 + α(T - 25)]</p>
                    <p><small>Where EC₂₅ is the conductivity at 25°C, EC_T is the conductivity at temperature T, and α is the temperature coefficient (typically 0.02/°C).</small></p>
                  </div>
                  
                  <div className="wq-parameter-image-gallery">
                    <div className="wq-image-row">
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/ec-applications.jpg" alt="EC Applications" className="wq-info-image" />
                        <p className="wq-image-caption">Applications of EC measurements in various fields</p>
                      </div>
                      <div className="wq-image-container">
                        <img src="/src/assets/water-quality/ec-meter.jpg" alt="EC Meter" className="wq-info-image" />
                        <p className="wq-image-caption">Professional EC measurement device</p>
                      </div>
                    </div>
                  </div>
                  
                  <h4>Impact on Water Quality</h4>
                  <div className="wq-impact-levels">
                    <div className="wq-impact-level">
                      <h5 className="text-success">Low EC (&lt;0.75 dS/m)</h5>
                      <p>Excellent for irrigation and most uses, indicates low salt content</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-primary">Moderate EC (0.75-3.0 dS/m)</h5>
                      <p>Usable for salt-tolerant crops, may require management for sensitive crops</p>
                    </div>
                    <div className="wq-impact-level">
                      <h5 className="text-danger">High EC (&gt;3.0 dS/m)</h5>
                      <p>Severe restrictions for irrigation, high salt content, can damage plants and soil structure</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="wq-modal-footer">
          <button onClick={onClose} className="wq-close-button">
            Close
          </button>
        </div>
      </div>
    
      {expandedImage && (
        <div className="wq-expanded-image-overlay" onClick={closeExpandedImage}>
          <div className="wq-expanded-image-container">
            <img 
              src={expandedImage.src} 
              alt={expandedImage.alt} 
              className="wq-expanded-image" 
              onClick={(e) => e.stopPropagation()}
            />
            <button className="wq-expanded-image-close" onClick={closeExpandedImage}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterQualityInfoModal;