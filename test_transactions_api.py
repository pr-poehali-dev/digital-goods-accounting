#!/usr/bin/env python3
import urllib.request
import urllib.parse
import json

# Transactions API endpoint
TRANSACTIONS_URL = "https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d"

print("=" * 80)
print("TESTING TRANSACTIONS API ENDPOINT")
print("=" * 80)
print()

# Test 1: Simple GET request to list transactions
print("TEST 1: GET /transactions (list all)")
print("-" * 80)
try:
    req = urllib.request.Request(TRANSACTIONS_URL, method='GET')
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Status: {response.status}")
        print(f"Response keys: {data.keys()}")
        
        if 'transactions' in data:
            transactions = data['transactions']
            print(f"Total transactions returned: {len(transactions)}")
            print()
            
            if len(transactions) > 0:
                print("Sample transaction (first one):")
                first = transactions[0]
                for key, value in first.items():
                    print(f"  {key}: {value}")
                print()
                
                print("Last 10 transactions:")
                print(f"{'ID':<6} {'Date':<12} {'Client':<20} {'Amount':<10} {'Status':<10}")
                print("-" * 70)
                for t in transactions[:10]:
                    trans_id = t.get('id', 'N/A')
                    date = t.get('transaction_date', 'N/A')
                    if date and date != 'N/A':
                        date = date.split('T')[0]  # Extract just the date part
                    client = t.get('client_name', 'N/A') or 'N/A'
                    amount = t.get('amount', 0)
                    status = t.get('status', 'N/A')
                    print(f"{trans_id:<6} {date:<12} {client:<20} {amount:<10} {status:<10}")
            else:
                print("No transactions found")
        else:
            print("Unexpected response format:")
            print(json.dumps(data, indent=2))
        
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")

print()
print()

# Test 2: GET request with stats action
print("TEST 2: GET /transactions?action=stats&date_filter=all")
print("-" * 80)
try:
    params = urllib.parse.urlencode({'action': 'stats', 'date_filter': 'all'})
    url_with_params = f"{TRANSACTIONS_URL}?{params}"
    
    req = urllib.request.Request(url_with_params, method='GET')
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Status: {response.status}")
        print()
        print("Statistics:")
        for key, value in data.items():
            if key != 'product_analytics' and key != 'daily_analytics':
                print(f"  {key}: {value}")
        
        if 'product_analytics' in data:
            print(f"\nProduct Analytics: {len(data['product_analytics'])} products")
            
        if 'daily_analytics' in data:
            print(f"Daily Analytics: {len(data['daily_analytics'])} days")
            print("\nLast 5 days from daily analytics:")
            for day in data['daily_analytics'][-5:]:
                print(f"  {day['date']}: {day['count']} transactions, profit: {day['profit']}")
        
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    error_body = e.read().decode('utf-8')
    print(f"Response: {error_body}")
    try:
        error_json = json.loads(error_body)
        print(f"\nError details:")
        print(json.dumps(error_json, indent=2))
    except:
        pass
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print()
print()

# Test 3: GET request with specific date filter for Sept 18, 2024
print("TEST 3: GET /transactions?action=stats&date_filter=custom&start_date=2024-09-18&end_date=2024-09-18")
print("-" * 80)
try:
    params = urllib.parse.urlencode({
        'action': 'stats',
        'date_filter': 'custom',
        'start_date': '2024-09-18',
        'end_date': '2024-09-18'
    })
    url_with_params = f"{TRANSACTIONS_URL}?{params}"
    
    req = urllib.request.Request(url_with_params, method='GET')
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=30) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f"Status: {response.status}")
        print()
        print("Statistics for 2024-09-18:")
        print(f"  Total transactions: {data.get('total_transactions', 0)}")
        print(f"  Total revenue: {data.get('total_revenue', 0)}")
        print(f"  Total profit: {data.get('total_profit', 0)}")
        print(f"  Completed: {data.get('completed_count', 0)}")
        
        if 'daily_analytics' in data and len(data['daily_analytics']) > 0:
            print("\nDaily breakdown:")
            for day in data['daily_analytics']:
                if day['count'] > 0:
                    print(f"  {day['date']}: {day['count']} transactions, revenue: {day['revenue']}, profit: {day['profit']}")
        
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    error_body = e.read().decode('utf-8')
    print(f"Response: {error_body}")
    try:
        error_json = json.loads(error_body)
        print(f"\nError details:")
        print(json.dumps(error_json, indent=2))
    except:
        pass
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print()
print("=" * 80)
print("TEST COMPLETED")
print("=" * 80)
