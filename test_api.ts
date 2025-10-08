const API_URL = "https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d";

interface TestData {
  product_id: number;
  client_telegram: string;
  client_name: string;
  status: string;
  notes: string;
  currency: string;
  transaction_date: string;
}

interface PostResponse {
  success?: boolean;
  transaction_id?: number;
  transaction_code?: string;
  error?: string;
}

interface Transaction {
  id: number;
  transaction_code: string;
  product_id: number;
  product_name: string;
  client_telegram: string;
  client_name: string;
  amount: number;
  cost_price: number;
  profit: number;
  status: string;
  transaction_date: string;
  notes: string;
  currency: string;
}

interface GetResponse {
  transactions?: Transaction[];
}

const testData: TestData = {
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

  let postSuccess = false;
  let createdTransactionId: number | undefined;

  try {
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const postData: PostResponse = await postResponse.json();
    
    console.log("POST Response:");
    console.log(JSON.stringify(postData, null, 2));
    console.log(`\nHTTP Status Code: ${postResponse.status}`);
    
    if (postResponse.ok && postData.success) {
      postSuccess = true;
      createdTransactionId = postData.transaction_id;
      console.log(`✓ POST SUCCESS`);
      console.log(`  Transaction ID: ${postData.transaction_id}`);
      console.log(`  Transaction Code: ${postData.transaction_code || 'N/A'}`);
    } else {
      console.log(`✗ POST FAILED`);
      if (postData.error) {
        console.log(`  Error: ${postData.error}`);
      }
    }
  } catch (error) {
    console.error(`✗ POST Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: GET - Fetching all transactions");
  console.log("=".repeat(60));
  console.log(`URL: ${API_URL}`);
  console.log();

  let foundInGet = false;

  try {
    const getResponse = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const getData: GetResponse = await getResponse.json();
    
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
        foundInGet = true;
        console.log("✓ Test transaction found in GET results!");
        console.log("\nTest Transaction Details:");
        console.log(JSON.stringify(testTransaction, null, 2));
      } else {
        console.log("✗ Test transaction NOT found in GET results");
        console.log("\nShowing first 3 transactions for reference:");
        transactions.slice(0, 3).forEach(t => {
          console.log(`  - ID: ${t.id}, Client: ${t.client_telegram || 'N/A'}, Date: ${t.transaction_date || 'N/A'}, Product: ${t.product_name}`);
        });
      }
    } else {
      console.log("Unexpected response format:");
      console.log(JSON.stringify(getData, null, 2));
    }
  } catch (error) {
    console.error(`✗ GET Error: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`POST Request: ${postSuccess ? '✓ SUCCESS' : '✗ FAILED'}`);
  console.log(`GET Request: ${foundInGet ? '✓ Transaction found' : '✗ Transaction not found or GET failed'}`);
  console.log("=".repeat(60));
}

testAPI();
