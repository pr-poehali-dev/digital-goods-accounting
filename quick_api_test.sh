#!/bin/bash

echo "=========================================="
echo "QUICK API TEST - TRANSACTIONS ENDPOINT"
echo "=========================================="
echo ""

TRANSACTIONS_URL="https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d"

echo "Test 1: GET /transactions (list all)"
echo "------------------------------------------"
curl -s -X GET "$TRANSACTIONS_URL" | jq '.' || curl -s -X GET "$TRANSACTIONS_URL"
echo ""
echo ""

echo "Test 2: GET /transactions?action=stats&date_filter=all"
echo "------------------------------------------"
curl -s -X GET "${TRANSACTIONS_URL}?action=stats&date_filter=all" | jq '.' || curl -s -X GET "${TRANSACTIONS_URL}?action=stats&date_filter=all"
echo ""
echo ""

echo "Test 3: GET /transactions?action=stats&date_filter=custom&start_date=2024-09-18&end_date=2024-09-18"
echo "------------------------------------------"
curl -s -X GET "${TRANSACTIONS_URL}?action=stats&date_filter=custom&start_date=2024-09-18&end_date=2024-09-18" | jq '.' || curl -s -X GET "${TRANSACTIONS_URL}?action=stats&date_filter=custom&start_date=2024-09-18&end_date=2024-09-18"
echo ""
echo ""

echo "=========================================="
echo "TESTS COMPLETED"
echo "=========================================="
