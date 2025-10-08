#!/bin/bash

API_URL="https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d"

echo "============================================================"
echo "TRANSACTION API TEST - POST & GET"
echo "============================================================"
echo ""

# Test data
TEST_DATA='{
  "product_id": 1,
  "client_telegram": "@test_user",
  "client_name": "",
  "status": "completed",
  "notes": "Test transaction",
  "currency": "RUB",
  "transaction_date": "2025-09-18"
}'

echo "TEST 1: POST - Creating a new transaction"
echo "============================================================"
echo "URL: $API_URL"
echo "Data:"
echo "$TEST_DATA" | jq '.'
echo ""
echo "Sending POST request..."
echo ""

# Make POST request and capture response
POST_RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

echo "POST Response:"
echo "$POST_RESPONSE" | jq '.' 2>/dev/null || echo "$POST_RESPONSE"
echo ""

# Check if POST was successful
if echo "$POST_RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
  echo "✓ POST SUCCESS"
  TRANSACTION_ID=$(echo "$POST_RESPONSE" | jq -r '.transaction_id')
  TRANSACTION_CODE=$(echo "$POST_RESPONSE" | jq -r '.transaction_code')
  echo "  Transaction ID: $TRANSACTION_ID"
  echo "  Transaction Code: $TRANSACTION_CODE"
  POST_SUCCESS=true
else
  echo "✗ POST FAILED"
  ERROR=$(echo "$POST_RESPONSE" | jq -r '.error // "Unknown error"')
  echo "  Error: $ERROR"
  POST_SUCCESS=false
fi

echo ""
echo ""
echo "TEST 2: GET - Fetching all transactions to verify creation"
echo "============================================================"
echo "URL: $API_URL"
echo ""
echo "Sending GET request..."
echo ""

# Make GET request
GET_RESPONSE=$(curl -s -X GET "$API_URL" \
  -H "Content-Type: application/json")

# Count total transactions
TOTAL_TRANSACTIONS=$(echo "$GET_RESPONSE" | jq -r '.transactions | length' 2>/dev/null)

if [ "$TOTAL_TRANSACTIONS" != "null" ] && [ "$TOTAL_TRANSACTIONS" != "" ]; then
  echo "Total transactions returned: $TOTAL_TRANSACTIONS"
  echo ""
  
  # Try to find our test transaction
  TEST_TRANSACTION=$(echo "$GET_RESPONSE" | jq '.transactions[] | select(.client_telegram == "@test_user" and .transaction_date == "2025-09-18")' 2>/dev/null)
  
  if [ -n "$TEST_TRANSACTION" ]; then
    echo "✓ Test transaction found in GET results!"
    echo ""
    echo "Test Transaction Details:"
    echo "$TEST_TRANSACTION" | jq '.'
    GET_SUCCESS=true
  else
    echo "✗ Test transaction NOT found in GET results"
    echo ""
    echo "Showing first 3 transactions for reference:"
    echo "$GET_RESPONSE" | jq -r '.transactions[0:3][] | "  - ID: \(.id), Client: \(.client_telegram // "N/A"), Date: \(.transaction_date // "N/A"), Product: \(.product_name)"' 2>/dev/null
    GET_SUCCESS=false
  fi
else
  echo "✗ GET request failed or returned unexpected format"
  echo "Response:"
  echo "$GET_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_RESPONSE"
  GET_SUCCESS=false
fi

echo ""
echo ""
echo "============================================================"
echo "TEST SUMMARY"
echo "============================================================"

if [ "$POST_SUCCESS" = true ]; then
  echo "✓ POST Request: SUCCESS"
else
  echo "✗ POST Request: FAILED"
fi

if [ "$GET_SUCCESS" = true ]; then
  echo "✓ GET Request: Transaction found"
else
  echo "✗ GET Request: Transaction not found or failed"
fi

echo "============================================================"
