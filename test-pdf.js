// Simple test to verify jsPDF autoTable works
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

console.log('Testing jsPDF autoTable...');

const doc = new jsPDF();
console.log('jsPDF instance created');

if (typeof autoTable === 'function') {
  console.log('✅ autoTable function is available!');
  
  // Test creating a simple table using functional approach
  autoTable(doc, {
    head: [['Name', 'Value']],
    body: [['Test', '123']],
  });
  
  console.log('✅ autoTable call successful!');
  console.log('doc.lastAutoTable exists:', !!doc.lastAutoTable);
  
  if (doc.lastAutoTable) {
    console.log('lastAutoTable finalY:', doc.lastAutoTable.finalY);
  }
  
  // Check other possible properties
  console.log('doc.autoTable exists after call:', typeof doc.autoTable);
  console.log('doc.previousAutoTable exists:', !!doc.previousAutoTable);
}
