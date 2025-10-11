'''
Business: Manage client data, top clients analytics, connections
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with client data and analytics
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    query_params: Dict[str, str] = event.get('queryStringParameters') or {}
    action: str = query_params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET' and action == 'list':
            query = '''
                WITH client_stats AS (
                    SELECT 
                        t.client_telegram,
                        t.client_name,
                        SUM(t.amount) as total_revenue,
                        COUNT(*) as purchase_count,
                        SUM(t.amount) / NULLIF(COUNT(*), 0) as avg_check,
                        MIN(t.transaction_date) as first_purchase,
                        MAX(t.transaction_date) as last_purchase
                    FROM t_p6388661_digital_goods_accoun.transactions t
                    WHERE t.status = 'completed'
                    GROUP BY t.client_telegram, t.client_name
                )
                SELECT 
                    COALESCE(c.id, 0) as id,
                    cs.client_telegram,
                    cs.client_name,
                    COALESCE(c.importance, 'medium') as importance,
                    COALESCE(c.comments, '') as comments,
                    cs.total_revenue::float,
                    cs.purchase_count::int,
                    cs.avg_check::float,
                    cs.first_purchase::text,
                    cs.last_purchase::text
                FROM client_stats cs
                LEFT JOIN t_p6388661_digital_goods_accoun.clients c 
                    ON cs.client_telegram = c.client_telegram
                ORDER BY cs.total_revenue DESC
            '''
            
            cur.execute(query)
            clients = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'clients': clients}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and action == 'connections':
            query = 'SELECT * FROM t_p6388661_digital_goods_accoun.client_connections ORDER BY created_at DESC'
            cur.execute(query)
            connections = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'connections': connections}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and action == 'update':
            body = json.loads(event.get('body', '{}'))
            client_id = body.get('client_id')
            client_telegram = body.get('client_telegram')
            importance = body.get('importance', 'medium')
            comments = body.get('comments', '')
            
            if client_id and client_id > 0:
                query = '''
                    UPDATE t_p6388661_digital_goods_accoun.clients 
                    SET importance = %s, comments = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                '''
                cur.execute(query, (importance, comments, client_id))
            else:
                cur.execute(
                    'SELECT client_telegram FROM t_p6388661_digital_goods_accoun.transactions WHERE client_telegram = %s LIMIT 1',
                    (client_telegram,)
                )
                if not cur.fetchone():
                    raise ValueError('Client not found in transactions')
                
                query = '''
                    INSERT INTO t_p6388661_digital_goods_accoun.clients 
                    (client_telegram, client_name, importance, comments)
                    SELECT %s, client_name, %s, %s
                    FROM t_p6388661_digital_goods_accoun.transactions
                    WHERE client_telegram = %s
                    LIMIT 1
                    ON CONFLICT (client_telegram) 
                    DO UPDATE SET importance = EXCLUDED.importance, comments = EXCLUDED.comments
                '''
                cur.execute(query, (client_telegram, importance, comments, client_telegram))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and action == 'add-connection':
            body = json.loads(event.get('body', '{}'))
            telegram_from = body.get('client_telegram_from')
            telegram_to = body.get('client_telegram_to')
            connection_type = body.get('connection_type', '')
            description = body.get('description', '')
            
            cur.execute(
                'INSERT INTO t_p6388661_digital_goods_accoun.clients (client_telegram, client_name) SELECT %s, client_name FROM t_p6388661_digital_goods_accoun.transactions WHERE client_telegram = %s LIMIT 1 ON CONFLICT DO NOTHING',
                (telegram_from, telegram_from)
            )
            cur.execute(
                'INSERT INTO t_p6388661_digital_goods_accoun.clients (client_telegram, client_name) SELECT %s, client_name FROM t_p6388661_digital_goods_accoun.transactions WHERE client_telegram = %s LIMIT 1 ON CONFLICT DO NOTHING',
                (telegram_to, telegram_to)
            )
            
            cur.execute(
                'SELECT id FROM t_p6388661_digital_goods_accoun.clients WHERE client_telegram = %s',
                (telegram_from,)
            )
            from_id = cur.fetchone()['id']
            
            cur.execute(
                'SELECT id FROM t_p6388661_digital_goods_accoun.clients WHERE client_telegram = %s',
                (telegram_to,)
            )
            to_id = cur.fetchone()['id']
            
            query = '''
                INSERT INTO t_p6388661_digital_goods_accoun.client_connections 
                (client_id_from, client_id_to, connection_type, description)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (client_id_from, client_id_to) DO NOTHING
            '''
            cur.execute(query, (from_id, to_id, connection_type, description))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()