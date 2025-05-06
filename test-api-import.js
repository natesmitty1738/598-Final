const fs = require('fs');
const path = require('path');

// Create a sample CSV file for testing
function createSampleCsvFile() {
  const csvContent = `date,productId,productName,quantity,unitPrice,totalAmount
2025-01-01,SKU001,Premium T-Shirt (Black),2,29.99,59.98
2025-01-01,SKU004,Canvas Tote Bag,1,24.99,24.99
2025-01-02,SKU002,Vintage Hoodie,1,49.99,49.99
2025-01-02,SKU003,Designer Jeans,1,59.99,59.99
2025-01-03,SKU001,Premium T-Shirt (Black),1,29.99,29.99
2025-01-03,SKU005,Embroidered Cap,1,19.99,19.99`;

  const filePath = path.join(__dirname, 'test-sales-data.csv');
  fs.writeFileSync(filePath, csvContent);
  console.log(`Sample CSV file created at ${filePath}`);
  return filePath;
}

// Main test function
async function main() {
  try {
    const csvFilePath = createSampleCsvFile();
    
    console.log('Sample CSV file created. To test:');
    console.log('1. Start the application with "npm run dev"');
    console.log('2. Go to http://localhost:3000/dashboard/data-import');
    console.log('3. Upload the test-sales-data.csv file created at:', csvFilePath);
    console.log('4. Check if products and sales are created successfully in the UI');
    console.log('5. Verify in the products and sales pages that everything is linked correctly');
    
    console.log('\nYou can also use a second account to verify that importing the same file works correctly for different users.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 