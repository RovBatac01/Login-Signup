import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF report of sensor historical data
 * @param {Object} data - The sensor data to export
 * @param {string} filter - The time filter (e.g., "24h", "7d", "30d")
 * @param {string} establishmentName - Name of the establishment (optional)
 * @returns {Blob} - The generated PDF as a Blob
 */
export const exportToPdf = (data, filter, establishmentName = "All Establishments") => {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add title and metadata
  const title = `Water Quality Sensor Report`;
  const subtitle = `${getFilterName(filter)} - ${establishmentName}`;
  const dateGenerated = new Date().toLocaleString();

  // Set document metadata
  doc.setProperties({
    title: title,
    subject: subtitle,
    author: 'Water Quality Monitoring System',
    creator: 'Water Quality Monitoring System',
    keywords: 'water quality, sensors, report'
  });

  // Add header
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text(subtitle, 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${dateGenerated}`, 105, 38, { align: 'center' });

  // Add logo or image if available
  // doc.addImage(logoDataUrl, 'PNG', 10, 10, 30, 30);

  let yPos = 45;
  const pageWidth = doc.internal.pageSize.width;
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(33, 33, 33);
  doc.text('Summary of Readings', 105, yPos, { align: 'center' });
  yPos += 10;

  // Add report explanation
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const explanationText = getFilterExplanation(filter);
  const splitExplanation = doc.splitTextToSize(explanationText, pageWidth - 40);
  doc.text(splitExplanation, 20, yPos);
  yPos += splitExplanation.length * 5 + 5;

  // Add each sensor data to the PDF
  Object.keys(data).forEach((sensorName) => {
    const sensorData = data[sensorName];
    
    if (sensorData && sensorData.length > 0) {
      // Add sensor section header
      doc.setFontSize(12);
      doc.setTextColor(33, 33, 33);
      doc.text(`${sensorName} Readings`, 20, yPos);
      yPos += 7;

      // Calculate statistics
      const values = sensorData.map(item => item.Value);
      const stats = {
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        avg: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)
      };

      // Add statistics
      doc.setFontSize(10);
      doc.text(`Minimum: ${stats.min} ${sensorData[0].Unit}`, 25, yPos);
      yPos += 5;
      doc.text(`Maximum: ${stats.max} ${sensorData[0].Unit}`, 25, yPos);
      yPos += 5;
      doc.text(`Average: ${stats.avg} ${sensorData[0].Unit}`, 25, yPos);
      yPos += 10;

      // Generate a simplified line chart
      if (sensorData.length > 2) {
        try {
          // Create a simplified line chart 
          const chartWidth = 150;
          const chartHeight = 50;
          const chartX = 30;
          let chartY = yPos;
          
          // Draw chart border
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.rect(chartX, chartY, chartWidth, chartHeight);
          
          // Draw Y axis
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(stats.max, chartX - 5, chartY + 5, { align: 'right' });
          doc.text(stats.min, chartX - 5, chartY + chartHeight - 5, { align: 'right' });
          
          // Normalize values for drawing
          const normalizeY = (val) => {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const range = max - min;
            if (range === 0) return chartY + chartHeight / 2; // If all values are the same
            return chartY + chartHeight - ((val - min) / range) * chartHeight + 5;
          };
          
          // Draw the line chart
          doc.setDrawColor(41, 128, 185);
          doc.setLineWidth(1);
          
          // Use a simplified approach for large datasets
          const step = Math.max(1, Math.floor(sensorData.length / 20)); // Limit to ~20 points
          const visiblePoints = [];
          
          for (let i = 0; i < sensorData.length; i += step) {
            visiblePoints.push(sensorData[i]);
          }
          
          // Ensure the last point is included
          if (sensorData.length > 0 && visiblePoints[visiblePoints.length - 1] !== sensorData[sensorData.length - 1]) {
            visiblePoints.push(sensorData[sensorData.length - 1]);
          }
          
          // Draw lines connecting points
          for (let i = 0; i < visiblePoints.length - 1; i++) {
            const x1 = chartX + (i / (visiblePoints.length - 1)) * chartWidth;
            const y1 = normalizeY(visiblePoints[i].Value);
            const x2 = chartX + ((i + 1) / (visiblePoints.length - 1)) * chartWidth;
            const y2 = normalizeY(visiblePoints[i + 1].Value);
            
            doc.line(x1, y1, x2, y2);
          }
          
          // Draw dots at each point for emphasis
          doc.setFillColor(41, 128, 185);
          visiblePoints.forEach((point, index) => {
            const x = chartX + (index / (visiblePoints.length - 1)) * chartWidth;
            const y = normalizeY(point.Value);
            doc.circle(x, y, 1, 'F');
          });
          
          // Add X-axis time indicators (start, middle, end)
          if (visiblePoints.length > 0) {
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            
            // Start time
            const startTime = new Date(visiblePoints[0].Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            doc.text(startTime, chartX, chartY + chartHeight + 10, { align: 'left' });
            
            // Middle time
            const middleIndex = Math.floor(visiblePoints.length / 2);
            const middleTime = new Date(visiblePoints[middleIndex].Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            doc.text(middleTime, chartX + chartWidth / 2, chartY + chartHeight + 10, { align: 'center' });
            
            // End time
            const endTime = new Date(visiblePoints[visiblePoints.length - 1].Timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            doc.text(endTime, chartX + chartWidth, chartY + chartHeight + 10, { align: 'right' });
          }
          
          // Add chart title
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(`${sensorName} Trend Chart`, chartX + chartWidth / 2, chartY - 5, { align: 'center' });
          
          // Update position after chart
          yPos += chartHeight + 20;
        } catch (error) {
          console.error('Error generating chart:', error);
          // If chart generation fails, just continue without it
        }
      }

      // Prepare table data
      const tableColumn = ["Timestamp", `Value (${sensorData[0].Unit})`];
      const tableRows = sensorData.map(item => [
        item.Timestamp,
        item.Value.toFixed(2)
      ]);

      // Add the table
      autoTable(doc, {
        startY: yPos,
        head: [tableColumn],
        body: tableRows,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240]
        },
        margin: { left: 20, right: 20 },
        didDrawPage: (data) => {
          // Header on each page
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Water Quality Report - ${new Date().toLocaleDateString()}`, data.settings.margin.left, 10);
        }
      });
      
      // Update position after table
      yPos = doc.lastAutoTable.finalY + 15;
      
      // Check if we need a new page for the next section
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    }
  });

  // Add water quality interpretation guide at the end
  doc.addPage();
  addWaterQualityGuide(doc);

  // Return PDF as blob
  return doc.output('blob');
};

/**
 * Get a user-friendly name for the time filter
 * @param {string} filter - The filter code
 * @returns {string} - User-friendly filter name
 */
function getFilterName(filter) {
  switch (filter) {
    case 'realtime': return 'Real-time Data';
    case '24h': return 'Last 24 Hours';
    case '7d': return 'Last 7 Days (Average)';
    case '30d': return 'Last 30 Days (Average)';
    default: return filter;
  }
}

/**
 * Get explanation text for the time filter
 * @param {string} filter - The filter code
 * @returns {string} - Explanation text
 */
function getFilterExplanation(filter) {
  switch (filter) {
    case 'realtime':
      return 'This report contains the most recent sensor readings. Real-time data provides instantaneous feedback on current water quality conditions.';
    case '24h':
      return 'This report contains sensor readings from the past 24 hours. This short-term data helps identify recent water quality changes or issues that might require immediate attention.';
    case '7d':
      return 'This report contains average sensor readings from the past 7 days. Weekly averages help identify short-term trends and fluctuations in water quality parameters.';
    case '30d':
      return 'This report contains average sensor readings from the past 30 days. Monthly averages provide insight into longer-term water quality patterns and seasonal variations.';
    default:
      return 'This report contains historical sensor data based on the selected time period.';
  }
}

/**
 * Add a water quality interpretation guide to the PDF
 * @param {jsPDF} doc - The jsPDF document instance
 */
function addWaterQualityGuide(doc) {
  doc.setFontSize(16);
  doc.setTextColor(33, 33, 33);
  doc.text('Water Quality Parameter Interpretation Guide', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('The following guide helps interpret the readings for each water quality parameter:', 20, 30);
  
  // Parameter interpretation data
  const parameters = [
    {
      name: 'pH Level',
      ideal: '6.5 - 8.5',
      interpretations: [
        { range: 'Below 6.5', meaning: 'Acidic - May cause corrosion and affect aquatic life' },
        { range: '6.5 - 8.5', meaning: 'Optimal range for most water systems' },
        { range: 'Above 8.5', meaning: 'Alkaline - May indicate contamination or affect taste' }
      ]
    },
    {
      name: 'Temperature',
      ideal: 'Depends on water system',
      interpretations: [
        { range: 'Fluctuating', meaning: 'Rapid changes can stress aquatic ecosystems' },
        { range: 'Very high', meaning: 'Can reduce oxygen levels and affect aquatic life' }
      ]
    },
    {
      name: 'Turbidity',
      ideal: 'Below 1 NTU',
      interpretations: [
        { range: '0-1 NTU', meaning: 'Clear water, excellent clarity' },
        { range: '1-5 NTU', meaning: 'Slightly cloudy, acceptable for most uses' },
        { range: 'Above 5 NTU', meaning: 'Cloudy, may indicate contamination' }
      ]
    },
    {
      name: 'TDS (Total Dissolved Solids)',
      ideal: '50 - 500 ppm',
      interpretations: [
        { range: 'Below 50 ppm', meaning: 'Very low mineral content' },
        { range: '50 - 500 ppm', meaning: 'Excellent for most uses' },
        { range: '500 - 1000 ppm', meaning: 'Acceptable but may affect taste' },
        { range: 'Above 1000 ppm', meaning: 'High concentration, may affect equipment and taste' }
      ]
    },
    {
      name: 'Conductivity',
      ideal: '200 - 800 µS/cm',
      interpretations: [
        { range: 'Below 200 µS/cm', meaning: 'Low mineral content' },
        { range: '200 - 800 µS/cm', meaning: 'Typical range for freshwater' },
        { range: 'Above 800 µS/cm', meaning: 'High mineral content, may indicate contamination' }
      ]
    },
    {
      name: 'Salinity',
      ideal: 'Depends on water system',
      interpretations: [
        { range: '0 - 0.5 ppt', meaning: 'Freshwater' },
        { range: '0.5 - 30 ppt', meaning: 'Brackish water' },
        { range: 'Above 30 ppt', meaning: 'Saltwater' }
      ]
    }
  ];
  
  // Create interpretation tables for each parameter
  let yPos = 35;
  
  parameters.forEach(param => {
    // Add parameter name and ideal range
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text(`${param.name}`, 20, yPos);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`Ideal range: ${param.ideal}`, 120, yPos);
    yPos += 7;
    
    // Create interpretation table
    const tableRows = param.interpretations.map(interp => [interp.range, interp.meaning]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Range', 'Interpretation']],
      body: tableRows,
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      margin: { left: 20, right: 20 }
    });
    
    // Update position for next parameter
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Add a new page if necessary
    if (yPos > 270 && parameters.indexOf(param) < parameters.length - 1) {
      doc.addPage();
      yPos = 20;
    }
  });
  
  // Add disclaimer
  doc.setFontSize(9);
  doc.setTextColor(120);
  const disclaimer = "DISCLAIMER: This guide provides general interpretations of water quality parameters. Specific requirements may vary based on the intended use of water and local regulations. Consult with water quality experts for specific guidance.";
  const splitDisclaimer = doc.splitTextToSize(disclaimer, doc.internal.pageSize.width - 40);
  doc.text(splitDisclaimer, 20, 280);
}

/**
 * Saves the generated PDF file
 * @param {Blob} pdfBlob - The PDF blob to save
 * @param {string} filter - The time filter used
 * @param {string} establishmentName - Name of the establishment
 */
export const savePdf = (pdfBlob, filter, establishmentName = "AllEstablishments") => {
  // Create a sanitized filename
  const sanitizedName = establishmentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `WaterQualityReport_${sanitizedName}_${filter}_${new Date().toISOString().slice(0, 10)}.pdf`;
  
  // Create a download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  
  // Trigger download and clean up
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};
