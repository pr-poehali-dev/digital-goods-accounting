# SQL "Object Not Found" Error Analysis

## 1. Exact Table Name from Code

**Table Name:** `transactions`

### Found in backend/transactions/index.py:
- Line 70: `FROM transactions` (stats query)
- Line 156: `FROM transactions t` (with JOIN to products)
- Line 196: `FROM transactions` (daily stats)
- Line 305-312: Main SELECT with LEFT JOIN to products
- Line 393: INSERT INTO transactions
- Line 416: UPDATE transactions
- Line 436: DELETE FROM transactions

### Database Schema (from db_migrations/V0001__initial_schema.sql):
```sql
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(50) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(id),
    client_telegram VARCHAR(255),
    client_name VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);
```

## 2. Column Used in SQL Queries

The code uses `"transaction_date"` (with double quotes) in queries:
- Line 45: `"transaction_date"::date = '...'`
- Line 49: `"transaction_date"::date >= '...'`
- Line 55: `"transaction_date"::date BETWEEN '...' AND '...'`
- Line 98-99: `MIN("transaction_date"::date), MAX("transaction_date"::date)`
- Line 193: `"transaction_date"::date as date`
- Line 308: `t."transaction_date"`
- Line 311: `ORDER BY t."transaction_date" DESC`

## 3. Potential Issues

### Issue 1: Case Sensitivity
PostgreSQL treats unquoted identifiers as lowercase, but when you use double quotes, it becomes case-sensitive.
- The schema defines: `transaction_date` (lowercase, no quotes)
- The queries use: `"transaction_date"` (with quotes, preserving case)

**This should work fine** since the column name is lowercase in both places.

### Issue 2: Schema Search Path
The error "object not found" could indicate:
- The table is in a different schema (e.g., `public.transactions` vs just `transactions`)
- The DATABASE_URL connection string might not be setting the correct schema
- The user might not have permissions to access the table

### Issue 3: Table Existence
Need to verify:
- Is the table actually created in the database?
- Are migrations applied correctly?
- Is the connection pointing to the correct database?

## 4. Query Testing Plan

To diagnose the issue, we need to:

### Test 1: Simple SELECT
```sql
SELECT * FROM transactions LIMIT 10;
```

### Test 2: Check Table Exists
```sql
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename = 'transactions';
```

### Test 3: Check Current Schema
```sql
SELECT current_schema();
SHOW search_path;
```

### Test 4: Query with Date Filter
```sql
SELECT id, transaction_code, client_name, amount, currency, 
       transaction_date, status
FROM transactions
WHERE transaction_date::date = '2024-09-18'
ORDER BY transaction_date DESC;
```

### Test 5: Count Total Records
```sql
SELECT COUNT(*) FROM transactions;
```

## 5. API Endpoint Testing

The transactions API endpoint is:
`https://functions.poehali.dev/30786c37-9166-4479-a411-13efbc5df69d`

### Available Actions:
1. **GET** - List transactions (line 305-342)
2. **GET?action=stats** - Get statistics (line 37-303)
3. **POST** - Create transaction (line 344-408)
4. **PUT** - Update transaction status (line 410-429)
5. **DELETE** - Delete transaction (line 431-449)

## 6. Expected Data Structure

### Transaction Record:
```json
{
  "id": 1,
  "transaction_code": "TX-20240918...",
  "product_id": 1,
  "product_name": "Product Name",
  "client_telegram": "@username",
  "client_name": "Client Name",
  "amount": 1000.00,
  "cost_price": 500.00,
  "profit": 500.00,
  "status": "completed",
  "transaction_date": "2024-09-18T12:00:00",
  "currency": "RUB",
  "notes": "Some notes"
}
```

## 7. Investigation Steps

### Step 1: Run Test Script
Execute `test_transactions_api.py` to test the API directly and see what errors are returned:
```bash
python3 test_transactions_api.py
```

### Step 2: Check Database Connection
If we have DATABASE_URL, run `query_transactions.py`:
```bash
export DATABASE_URL="your_connection_string"
python3 query_transactions.py
```

### Step 3: Review Backend Logs
Check the deployed function logs at poehali.dev for any SQL errors or connection issues.

### Step 4: Verify Migrations
Ensure all migration files have been applied to the database:
- V0001__initial_schema.sql (creates transactions table)
- V0004__add_multi_currency_support.sql (adds currency column)

## 8. Common Causes of "Object Not Found"

1. **Schema Mismatch**: Table is in `public` schema but query doesn't specify it
2. **Case Sensitivity**: Using wrong case for table/column names with quotes
3. **Database Connection**: Connected to wrong database
4. **Permissions**: User doesn't have SELECT permission on the table
5. **Migrations Not Applied**: Table doesn't exist yet
6. **Typo in Table Name**: Unlikely here, but possible

## 9. Recommended Fix

If the issue is schema-related, update queries to explicitly use schema:
```python
# Change from:
cur.execute("SELECT * FROM transactions")

# To:
cur.execute("SELECT * FROM public.transactions")
```

Or set the search_path at connection time:
```python
conn = psycopg2.connect(dsn)
cur = conn.cursor()
cur.execute("SET search_path TO public")
```

## 10. Next Steps

1. Run the test scripts provided to get actual error messages
2. Check the database connection string and verify it's pointing to the correct database
3. Verify migrations have been applied
4. Check backend function logs for detailed SQL errors
5. Test queries directly in the database if you have access

---

## Files Created for Testing

1. **query_transactions.py** - Direct database query tool
   - Queries the transactions table directly
   - Shows table structure and data
   - Checks for Sept 18, 2024 transactions
   - Displays diagnostic information

2. **test_transactions_api.py** - API endpoint testing tool
   - Tests GET /transactions
   - Tests GET /transactions?action=stats
   - Tests with specific date filters
   - Shows actual API errors and responses

Run these scripts to get detailed information about the "object not found" error.
