import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление каталогом товаров (CRUD операции)
    Args: event с httpMethod, body для создания/обновления
    Returns: HTTP response со списком товаров или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        cur.execute(
            "SELECT id, name, cost_price, sale_price, description, is_active, created_at, currency, cost_price_usd, sale_price_usd FROM products WHERE is_active = true ORDER BY name"
        )
        rows = cur.fetchall()
        
        products = []
        for row in rows:
            margin = float(row[3]) - float(row[2])
            margin_percent = (margin / float(row[2]) * 100) if row[2] > 0 else 0
            
            products.append({
                'id': row[0],
                'name': row[1],
                'cost_price': float(row[2]),
                'sale_price': float(row[3]),
                'description': row[4],
                'is_active': row[5],
                'margin': margin,
                'margin_percent': round(margin_percent, 2),
                'created_at': row[6].isoformat() if row[6] else None,
                'currency': row[7] if len(row) > 7 else 'RUB',
                'cost_price_usd': float(row[8]) if len(row) > 8 and row[8] else None,
                'sale_price_usd': float(row[9]) if len(row) > 9 and row[9] else None
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'products': products}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '')
        cost_price = body_data.get('cost_price', 0)
        cost_price_usd = body_data.get('cost_price_usd')
        sale_price = body_data.get('sale_price', 0)
        sale_price_usd = body_data.get('sale_price_usd')
        description = body_data.get('description', '')
        
        cost_price_usd_str = str(cost_price_usd) if cost_price_usd else 'NULL'
        sale_price_usd_str = str(sale_price_usd) if sale_price_usd else 'NULL'
        
        cur.execute(
            "INSERT INTO products (name, cost_price, sale_price, description, cost_price_usd, sale_price_usd) VALUES ('" + name + "', " + str(cost_price) + ", " + str(sale_price) + ", '" + description + "', " + cost_price_usd_str + ", " + sale_price_usd_str + ") RETURNING id"
        )
        product_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'product_id': product_id}),
            'isBase64Encoded': False
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        product_id = body_data.get('id')
        name = body_data.get('name', '')
        cost_price = body_data.get('cost_price', 0)
        cost_price_usd = body_data.get('cost_price_usd')
        sale_price = body_data.get('sale_price', 0)
        sale_price_usd = body_data.get('sale_price_usd')
        description = body_data.get('description', '')
        
        cost_price_usd_str = str(cost_price_usd) if cost_price_usd else 'NULL'
        sale_price_usd_str = str(sale_price_usd) if sale_price_usd else 'NULL'
        
        cur.execute(
            "UPDATE products SET name = '" + name + "', cost_price = " + str(cost_price) + ", sale_price = " + str(sale_price) + ", description = '" + description + "', cost_price_usd = " + cost_price_usd_str + ", sale_price_usd = " + sale_price_usd_str + ", updated_at = CURRENT_TIMESTAMP WHERE id = " + str(product_id)
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
    
    if method == 'DELETE':
        params = event.get('queryStringParameters', {})
        product_id = params.get('id')
        
        cur.execute(
            "UPDATE products SET is_active = false WHERE id = " + str(product_id)
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