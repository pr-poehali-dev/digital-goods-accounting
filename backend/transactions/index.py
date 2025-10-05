import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление транзакциями (создание, просмотр, отчётность)
    Args: event с httpMethod, body для создания транзакций
    Returns: HTTP response со списком транзакций или статистикой
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        action = params.get('action', 'list')
        
        if action == 'stats':
            cur.execute("""
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(amount) as total_revenue,
                    SUM(cost_price) as total_costs,
                    SUM(profit) as total_profit,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
                FROM transactions
            """)
            stats = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'total_transactions': stats[0] or 0,
                    'total_revenue': float(stats[1]) if stats[1] else 0,
                    'total_costs': float(stats[2]) if stats[2] else 0,
                    'total_profit': float(stats[3]) if stats[3] else 0,
                    'completed_count': stats[4] or 0,
                    'pending_count': stats[5] or 0,
                    'failed_count': stats[6] or 0
                }),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT t.id, t.transaction_code, t.product_id, p.name, t.client_telegram, 
                   t.client_name, t.amount, t.cost_price, t.profit, t.status, 
                   t.transaction_date, t.notes
            FROM transactions t
            LEFT JOIN products p ON t.product_id = p.id
            ORDER BY t.transaction_date DESC
            LIMIT 100
        """)
        rows = cur.fetchall()
        
        transactions = []
        for row in rows:
            transactions.append({
                'id': row[0],
                'transaction_code': row[1],
                'product_id': row[2],
                'product_name': row[3],
                'client_telegram': row[4],
                'client_name': row[5],
                'amount': float(row[6]),
                'cost_price': float(row[7]),
                'profit': float(row[8]),
                'status': row[9],
                'transaction_date': row[10].isoformat() if row[10] else None,
                'notes': row[11]
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'transactions': transactions}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        product_id = body_data.get('product_id')
        client_telegram = body_data.get('client_telegram', '')
        client_name = body_data.get('client_name', '')
        status = body_data.get('status', 'completed')
        notes = body_data.get('notes', '')
        custom_amount = body_data.get('custom_amount')
        
        cur.execute(
            "SELECT cost_price, sale_price FROM products WHERE id = " + str(product_id)
        )
        product = cur.fetchone()
        
        if not product:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Product not found'}),
                'isBase64Encoded': False
            }
        
        cost_price = float(product[0])
        sale_price = float(custom_amount) if custom_amount else float(product[1])
        profit = sale_price - cost_price
        
        transaction_code = 'TX-' + datetime.now().strftime('%Y%m%d%H%M%S')
        
        cur.execute(
            "INSERT INTO transactions (transaction_code, product_id, client_telegram, client_name, amount, cost_price, profit, status, notes) VALUES ('" + transaction_code + "', " + str(product_id) + ", '" + client_telegram + "', '" + client_name + "', " + str(sale_price) + ", " + str(cost_price) + ", " + str(profit) + ", '" + status + "', '" + notes + "') RETURNING id"
        )
        transaction_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'transaction_id': transaction_id, 'transaction_code': transaction_code}),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        transaction_id = body_data.get('id')
        status = body_data.get('status')
        
        cur.execute(
            "UPDATE transactions SET status = '" + status + "' WHERE id = " + str(transaction_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }