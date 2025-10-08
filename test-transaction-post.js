const url = 'https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d';
const testData = {
  product_id: 1,
  client_telegram: "@test_user",
  client_name: "",
  status: "completed",
  notes: "Test transaction",
  currency: "RUB",
  transaction_date: "2025-09-18"
};

console.log('='.repeat(70));
console.log('TRANSACTION API TEST - POST & GET');
console.log('='.repeat(70));
console.log();

console.log('TEST 1: POST - Creating a new transaction');
console.log('-'.repeat(70));
console.log('URL:', url);
console.log('Request Body:', JSON.stringify(testData, null, 2));
console.log();

let postSuccess = false;
let transactionId = null;
let transactionCode = null;

// TEST 1: POST to create transaction
fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testData)
})
  .then(async response => {
    const status = response.status;
    const data = await response.json();
    
    console.log('POST Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log();
    console.log(`HTTP Status Code: ${status}`);
    console.log();
    
    if (response.ok && data.success) {
      postSuccess = true;
      transactionId = data.transaction_id;
      transactionCode = data.transaction_code;
      console.log('✓ POST SUCCESS');
      console.log(`  Transaction ID: ${transactionId}`);
      console.log(`  Transaction Code: ${transactionCode}`);
    } else {
      console.log('✗ POST FAILED');
      if (data.error) {
        console.log(`  Error: ${data.error}`);
      }
    }
    
    console.log();
    console.log();
    
    // TEST 2: GET to verify transaction was created
    console.log('TEST 2: GET - Fetching all transactions to verify creation');
    console.log('-'.repeat(70));
    console.log('URL:', url);
    console.log();
    
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  })
  .then(async response => {
    const data = await response.json();
    
    if (data.transactions) {
      const transactions = data.transactions;
      console.log(`Total transactions returned: ${transactions.length}`);
      console.log();
      
      // Find our test transaction
      const testTransaction = transactions.find(t => 
        t.client_telegram === '@test_user' && 
        t.transaction_date === '2025-09-18'
      );
      
      if (testTransaction) {
        console.log('✓ Test transaction found in GET results!');
        console.log();
        console.log('Test Transaction Details:');
        console.log(JSON.stringify(testTransaction, null, 2));
      } else {
        console.log('✗ Test transaction NOT found in GET results');
        console.log();
        console.log('Showing first 3 transactions for reference:');
        transactions.slice(0, 3).forEach(t => {
          console.log(`  - ID: ${t.id}, Client: ${t.client_telegram || 'N/A'}, Date: ${t.transaction_date || 'N/A'}, Product: ${t.product_name}`);
        });
      }
      
      console.log();
      console.log();
      console.log('='.repeat(70));
      console.log('TEST SUMMARY');
      console.log('='.repeat(70));
      console.log(`POST Request: ${postSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
      console.log(`GET Request:  ${testTransaction ? '✓ Transaction found' : '✗ Transaction not found'}`);
      console.log('='.repeat(70));
      
    } else {
      console.log('✗ Unexpected response format:');
      console.log(JSON.stringify(data, null, 2));
    }
  })
  .catch(error => {
    console.log('✗ Error occurred:');
    console.log(error.message);
    console.log();
    console.log('Error Details:');
    console.log(error);
  });
