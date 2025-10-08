const API_URL = "https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d";

const testData = {
  product_id: 1,
  client_telegram: "@test_user",
  client_name: "",
  status: "completed",
  notes: "Test transaction",
  currency: "RUB",
  transaction_date: "2025-09-18"
};

async function testAPI() {
  console.log("=".repeat(60));
  console.log("TEST 1: POST - Creating a new transaction");
  console.log("=".repeat(60));
  console.log(`URL: ${API_URL}`);
  console.log(`Data: ${JSON.stringify(testData, null, 2)}`);
  console.log();

  try {
    // POST request
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const postData = await postResponse.json();
    
    console.log("POST Response:");
    console.log(JSON.stringify(postData, null, 2));
    console.log(`\nStatus: ${postResponse.ok ? 'Success' : 'Failed'}`);
    console.log(`HTTP Status Code: ${postResponse.status}`);
    
    if (postData.transaction_id) {
      console.log(`Transaction ID: ${postData.transaction_id}`);
      console.log(`Transaction Code: ${postData.transaction_code || 'N/A'}`);
    }
    
    if (postData.error) {
      console.log(`Error: ${postData.error}`);
    }
  } catch (error) {
    console.error(`POST Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: GET - Fetching all transactions");
  console.log("=".repeat(60));
  console.log(`URL: ${API_URL}`);
  console.log();

  try {
    // GET request
    const getResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const getData = await getResponse.json();
    
    if (getData.transactions) {
      const transactions = getData.transactions;
      console.log(`Total transactions returned: ${transactions.length}`);
      console.log();
      
      // Find our test transaction
      const testTransaction = transactions.find(t => 
        t.client_telegram === '@test_user' && 
        t.transaction_date === '2025-09-18'
      );
      
      if (testTransaction) {
        console.log("✓ Test transaction found in results!");
        console.log("\nTest Transaction Details:");
        console.log(JSON.stringify(testTransaction, null, 2));
      } else {
        console.log("✗ Test transaction NOT found in results");
        console.log("\nShowing first 3 transactions for reference:");
        transactions.slice(0, 3).forEach(t => {
          console.log(`  - ID: ${t.id}, Client: ${t.client_telegram || 'N/A'}, Date: ${t.transaction_date || 'N/A'}`);
        });
      }
    } else {
      console.log("Unexpected response format:");
      console.log(JSON.stringify(getData, null, 2));
    }
  } catch (error) {
    console.error(`GET Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY COMPLETE");
  console.log("=".repeat(60));
}

testAPI();
