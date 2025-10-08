#!/usr/bin/env python3
"""
Test script to verify transaction creation via POST API
"""
import json
import urllib.request
import urllib.error

API_URL = "https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d"

# Test data for creating a transaction
test_data = {
    "product_id": 1,
    "client_telegram": "@test_user",
    "client_name": "",
    "status": "completed",
    "notes": "Test transaction",
    "currency": "RUB",
    "transaction_date": "2025-09-18"
}

def main():
    print("=" * 70)
    print("TRANSACTION API TEST - POST & GET")
    print("=" * 70)
    print()
    
    # TEST 1: POST - Create transaction
    print("TEST 1: POST - Creating a new transaction")
    print("-" * 70)
    print(f"URL: {API_URL}")
    print(f"Data: {json.dumps(test_data, indent=2)}")
    print()
    
    post_success = False
    transaction_id = None
    transaction_code = None
    
    try:
        post_data = json.dumps(test_data).encode('utf-8')
        post_request = urllib.request.Request(
            API_URL,
            data=post_data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        
        with urllib.request.urlopen(post_request, timeout=30) as response:
            post_response = json.loads(response.read().decode('utf-8'))
            
            print("POST Response:")
            print(json.dumps(post_response, indent=2))
            print()
            print(f"HTTP Status Code: {response.status}")
            print()
            
            if post_response.get('success'):
                post_success = True
                transaction_id = post_response.get('transaction_id')
                transaction_code = post_response.get('transaction_code')
                print("✓ POST SUCCESS")
                print(f"  Transaction ID: {transaction_id}")
                print(f"  Transaction Code: {transaction_code}")
            else:
                print("✗ POST FAILED")
                if 'error' in post_response:
                    print(f"  Error: {post_response['error']}")
                    
    except urllib.error.HTTPError as e:
        print(f"✗ POST HTTP Error: {e.code}")
        error_body = e.read().decode('utf-8')
        print(f"Response: {error_body}")
        try:
            error_json = json.loads(error_body)
            print(f"Error details: {json.dumps(error_json, indent=2)}")
        except:
            pass
    except Exception as e:
        print(f"✗ POST Error: {str(e)}")
    
    print()
    print()
    
    # TEST 2: GET - Verify transaction was created
    print("TEST 2: GET - Fetching all transactions to verify creation")
    print("-" * 70)
    print(f"URL: {API_URL}")
    print()
    
    get_success = False
    
    try:
        get_request = urllib.request.Request(API_URL, method='GET')
        get_request.add_header('Content-Type', 'application/json')
        
        with urllib.request.urlopen(get_request, timeout=30) as response:
            get_response = json.loads(response.read().decode('utf-8'))
            
            if 'transactions' in get_response:
                transactions = get_response['transactions']
                print(f"Total transactions returned: {len(transactions)}")
                print()
                
                # Find our test transaction
                test_transaction = None
                for t in transactions:
                    if (t.get('client_telegram') == '@test_user' and 
                        t.get('transaction_date') == '2025-09-18'):
                        test_transaction = t
                        break
                
                if test_transaction:
                    get_success = True
                    print("✓ Test transaction found in GET results!")
                    print()
                    print("Test Transaction Details:")
                    print(json.dumps(test_transaction, indent=2))
                else:
                    print("✗ Test transaction NOT found in GET results")
                    print()
                    print("Showing first 3 transactions for reference:")
                    for t in transactions[:3]:
                        print(f"  - ID: {t['id']}, Client: {t.get('client_telegram', 'N/A')}, "
                              f"Date: {t.get('transaction_date', 'N/A')}, "
                              f"Product: {t.get('product_name', 'N/A')}")
            else:
                print("✗ Unexpected response format:")
                print(json.dumps(get_response, indent=2))
                
    except urllib.error.HTTPError as e:
        print(f"✗ GET HTTP Error: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"✗ GET Error: {str(e)}")
    
    print()
    print()
    
    # Summary
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"POST Request: {'✓ SUCCESS' if post_success else '✗ FAILED'}")
    print(f"GET Request:  {'✓ Transaction found' if get_success else '✗ Transaction not found or failed'}")
    print("=" * 70)
    
    return 0 if (post_success and get_success) else 1

if __name__ == '__main__':
    exit(main())
