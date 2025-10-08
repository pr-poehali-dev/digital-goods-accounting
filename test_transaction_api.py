#!/usr/bin/env python3
import json
import urllib.request
import urllib.error

API_URL = "https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d"

# Test data
test_data = {
    "product_id": 1,
    "client_telegram": "@test_user",
    "client_name": "",
    "status": "completed",
    "notes": "Test transaction",
    "currency": "RUB",
    "transaction_date": "2025-09-18"
}

print("=" * 60)
print("TEST 1: POST - Creating a new transaction")
print("=" * 60)
print(f"URL: {API_URL}")
print(f"Data: {json.dumps(test_data, indent=2)}")
print()

try:
    # POST request
    post_data = json.dumps(test_data).encode('utf-8')
    post_request = urllib.request.Request(
        API_URL,
        data=post_data,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    with urllib.request.urlopen(post_request) as response:
        post_response = json.loads(response.read().decode('utf-8'))
        print("POST Response:")
        print(json.dumps(post_response, indent=2))
        print(f"\nStatus: Success")
        
        if 'transaction_id' in post_response:
            print(f"Transaction ID: {post_response['transaction_id']}")
            print(f"Transaction Code: {post_response.get('transaction_code', 'N/A')}")
except urllib.error.HTTPError as e:
    print(f"POST Error: HTTP {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"POST Error: {str(e)}")

print("\n" + "=" * 60)
print("TEST 2: GET - Fetching all transactions")
print("=" * 60)
print(f"URL: {API_URL}")
print()

try:
    # GET request
    get_request = urllib.request.Request(API_URL, method='GET')
    
    with urllib.request.urlopen(get_request) as response:
        get_response = json.loads(response.read().decode('utf-8'))
        
        if 'transactions' in get_response:
            transactions = get_response['transactions']
            print(f"Total transactions returned: {len(transactions)}")
            print()
            
            # Find our test transaction
            test_transaction = None
            for t in transactions:
                if t.get('client_telegram') == '@test_user' and t.get('transaction_date') == '2025-09-18':
                    test_transaction = t
                    break
            
            if test_transaction:
                print("✓ Test transaction found in results!")
                print("\nTest Transaction Details:")
                print(json.dumps(test_transaction, indent=2))
            else:
                print("✗ Test transaction NOT found in results")
                print("\nShowing first 3 transactions for reference:")
                for t in transactions[:3]:
                    print(f"  - ID: {t['id']}, Client: {t.get('client_telegram', 'N/A')}, Date: {t.get('transaction_date', 'N/A')}")
        else:
            print("Unexpected response format:")
            print(json.dumps(get_response, indent=2))
            
except urllib.error.HTTPError as e:
    print(f"GET Error: HTTP {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"GET Error: {str(e)}")

print("\n" + "=" * 60)
print("TEST SUMMARY")
print("=" * 60)
