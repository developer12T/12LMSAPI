const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust port if needed

async function testShowPnaDcEndpoint() {
  console.log('=== Testing show_pna_dc Endpoint ===\n');

  try {
    // Test GET request
    console.log('1. Testing GET /api/report-tms/planning-all/show-pna-dc');
    const getResponse = await axios.get(`${BASE_URL}/api/report-tms/planning-all/show-pna-dc`, {
      params: {
        hcase: 'show_pna_dc',
        p1: '105',
        p2: '',
        p3: '',
        p4: '',
        p5: ''
      }
    });

    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response Data Type:', typeof getResponse.data);
    console.log('GET Response Data Length:', Array.isArray(getResponse.data) ? getResponse.data.length : 'N/A');
    
    if (getResponse.data && Array.isArray(getResponse.data) && getResponse.data.length > 0) {
      console.log('GET Sample Data (first item):', JSON.stringify(getResponse.data[0], null, 2));
      
      // Show calculation verification
      const sampleItem = getResponse.data[0];
      if (sampleItem) {
        console.log('\nCalculation Verification:');
        console.log(`  TCO: ${sampleItem.tco}`);
        console.log(`  OCO: ${sampleItem.oco}`);
        console.log(`  PCO: ${sampleItem.pco}`);
        console.log(`  CCO: ${sampleItem.cco}`);
        console.log(`  Stock: ${sampleItem.stock}`);
        console.log(`  Balance (TCO - Stock): ${sampleItem.balance}`);
        console.log(`  Calculated TCO (OCO + PCO + CCO): ${sampleItem.calculated_tco}`);
        console.log(`  TCO Verification: ${sampleItem.tco_verification}`);
      }
    }

    console.log('');

    // Test POST request
    console.log('2. Testing POST /api/report-tms/planning-all/show-pna-dc');
    const postResponse = await axios.post(`${BASE_URL}/api/report-tms/planning-all/show-pna-dc`, {
      hcase: 'show_pna_dc',
      p1: '105',
      p2: '',
      p3: '',
      p4: '',
      p5: ''
    });

    console.log('POST Response Status:', postResponse.status);
    console.log('POST Response Data Type:', typeof postResponse.data);
    console.log('POST Response Data Length:', Array.isArray(postResponse.data) ? postResponse.data.length : 'N/A');
    
    if (postResponse.data && Array.isArray(postResponse.data) && postResponse.data.length > 0) {
      console.log('POST Sample Data (first item):', JSON.stringify(postResponse.data[0], null, 2));
    }

    console.log('\n=== Test Completed Successfully ===');
    console.log('Both GET and POST endpoints are working correctly.');
    console.log('The endpoint calls: EXEC [dbo].[page_Planning_all] \'show_pna_dc\',\'105\',\'\',\'\',\'\',\'\'');
    console.log('Added calculations:');
    console.log('  - balance = tco - stock');
    console.log('  - calculated_tco = oco + pco + cco');
    console.log('  - tco_verification = (tco == calculated_tco)');

  } catch (error) {
    console.error('Error testing endpoint:', error.message);
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Run the test
testShowPnaDcEndpoint(); 