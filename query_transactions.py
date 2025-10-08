#!/usr/bin/env python3
import os
import psycopg2
from datetime import datetime

# Get database URL from environment
dsn = os.environ.get('DATABASE_URL')

if not dsn:
    print("ERROR: DATABASE_URL environment variable is not set")
    print("Please set it using: export DATABASE_URL='your_database_connection_string'")
    exit(1)

try:
    # Connect to database
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    print("=" * 80)
    print("DATABASE QUERY INVESTIGATION - TRANSACTIONS TABLE")
    print("=" * 80)
    print()
    
    # 1. Confirm table exists and get basic info
    print("1. TABLE INFORMATION")
    print("-" * 80)
    print("Table name from code: transactions")
    print()
    
    # 2. Get total count
    cur.execute("SELECT COUNT(*) FROM transactions")
    total_count = cur.fetchone()[0]
    print(f"Total transactions count: {total_count}")
    print()
    
    # 3. Get last 10 transactions
    print("2. LAST 10 TRANSACTIONS (ordered by transaction_date DESC)")
    print("-" * 80)
    cur.execute("""
        SELECT id, transaction_code, client_name, amount, currency, 
               transaction_date, status
        FROM transactions
        ORDER BY transaction_date DESC
        LIMIT 10
    """)
    recent = cur.fetchall()
    
    if recent:
        print(f"{'ID':<6} {'Code':<20} {'Client':<20} {'Amount':<10} {'Currency':<8} {'Date':<20} {'Status':<10}")
        print("-" * 110)
        for row in recent:
            trans_id = row[0]
            code = row[1] or 'N/A'
            client = row[2] or 'N/A'
            amount = row[3]
            currency = row[4] if row[4] else 'RUB'
            trans_date = row[5].strftime('%Y-%m-%d %H:%M:%S') if row[5] else 'N/A'
            status = row[6]
            print(f"{trans_id:<6} {code:<20} {client:<20} {amount:<10} {currency:<8} {trans_date:<20} {status:<10}")
    else:
        print("No transactions found")
    print()
    
    # 4. Query for specific date: 2024-09-18
    print("3. TRANSACTIONS FOR DATE: 2024-09-18")
    print("-" * 80)
    cur.execute("""
        SELECT id, transaction_code, client_name, amount, currency, 
               transaction_date, status, profit
        FROM transactions
        WHERE transaction_date::date = '2024-09-18'
        ORDER BY transaction_date DESC
    """)
    sept_18_transactions = cur.fetchall()
    
    if sept_18_transactions:
        print(f"Found {len(sept_18_transactions)} transaction(s) for 2024-09-18:")
        print()
        print(f"{'ID':<6} {'Code':<20} {'Client':<20} {'Amount':<10} {'Currency':<8} {'Date':<20} {'Status':<10} {'Profit':<10}")
        print("-" * 120)
        for row in sept_18_transactions:
            trans_id = row[0]
            code = row[1] or 'N/A'
            client = row[2] or 'N/A'
            amount = row[3]
            currency = row[4] if row[4] else 'RUB'
            trans_date = row[5].strftime('%Y-%m-%d %H:%M:%S') if row[5] else 'N/A'
            status = row[6]
            profit = row[7]
            print(f"{trans_id:<6} {code:<20} {client:<20} {amount:<10} {currency:<8} {trans_date:<20} {status:<10} {profit:<10}")
    else:
        print("No transactions found for 2024-09-18")
    print()
    
    # 5. Get date range
    print("4. DATE RANGE IN DATABASE")
    print("-" * 80)
    cur.execute("""
        SELECT MIN(transaction_date::date) as earliest, 
               MAX(transaction_date::date) as latest
        FROM transactions
    """)
    date_range = cur.fetchone()
    if date_range and date_range[0]:
        print(f"Earliest transaction: {date_range[0]}")
        print(f"Latest transaction: {date_range[1]}")
    else:
        print("No transactions with dates found")
    print()
    
    # 6. Table structure
    print("5. TABLE STRUCTURE")
    print("-" * 80)
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'transactions'
        ORDER BY ordinal_position
    """)
    columns = cur.fetchall()
    print(f"{'Column Name':<30} {'Data Type':<20} {'Nullable':<10}")
    print("-" * 60)
    for col in columns:
        print(f"{col[0]:<30} {col[1]:<20} {col[2]:<10}")
    print()
    
    # 7. Check for any "object not found" related issues
    print("6. DIAGNOSTICS")
    print("-" * 80)
    
    # Check if table exists in current schema
    cur.execute("""
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename = 'transactions'
    """)
    table_info = cur.fetchone()
    if table_info:
        print(f"Table exists in schema: {table_info[0]}")
    else:
        print("WARNING: Table 'transactions' not found in pg_tables!")
    
    # Check current schema
    cur.execute("SELECT current_schema()")
    current_schema = cur.fetchone()[0]
    print(f"Current database schema: {current_schema}")
    
    # Check search path
    cur.execute("SHOW search_path")
    search_path = cur.fetchone()[0]
    print(f"Search path: {search_path}")
    print()
    
    print("=" * 80)
    print("QUERY COMPLETED SUCCESSFULLY")
    print("=" * 80)
    
    cur.close()
    conn.close()
    
except psycopg2.Error as e:
    print(f"DATABASE ERROR: {e}")
    print(f"Error Code: {e.pgcode}")
    print(f"Error Message: {e.pgerror}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
