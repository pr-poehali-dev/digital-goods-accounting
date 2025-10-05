import json
import os
import psycopg2
import hmac
import hashlib
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Авторизация через Telegram Login Widget с проверкой hash
    Args: event с httpMethod, body с данными от Telegram
    Returns: HTTP response с результатом авторизации
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        telegram_id = body_data.get('id')
        first_name = body_data.get('first_name', '')
        last_name = body_data.get('last_name', '')
        username = body_data.get('username', '')
        photo_url = body_data.get('photo_url', '')
        auth_date = body_data.get('auth_date')
        hash_value = body_data.get('hash')
        
        if not telegram_id or not hash_value:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid data from Telegram'}),
                'isBase64Encoded': False
            }
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
        
        if not bot_token:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Bot token not configured'}),
                'isBase64Encoded': False
            }
        
        data_check_arr = []
        for key in ['id', 'first_name', 'last_name', 'username', 'photo_url', 'auth_date']:
            if key in body_data and body_data[key]:
                data_check_arr.append(f"{key}={body_data[key]}")
        
        data_check_arr.sort()
        data_check_string = '\n'.join(data_check_arr)
        
        secret_key = hashlib.sha256(bot_token.encode()).digest()
        expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        
        if expected_hash != hash_value:
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid hash - possible attack'}),
                'isBase64Encoded': False
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute(
            "SELECT id FROM allowed_users WHERE telegram_id = " + str(telegram_id)
        )
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Access denied - user not in whitelist'}),
                'isBase64Encoded': False
            }
        
        escaped_username = username.replace("'", "''")
        escaped_first = first_name.replace("'", "''")
        escaped_last = last_name.replace("'", "''")
        
        cur.execute(
            "UPDATE allowed_users SET username = '" + escaped_username + "' WHERE telegram_id = " + str(telegram_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': {
                    'id': telegram_id,
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'photo_url': photo_url
                }
            }),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        action = params.get('action', '')
        
        if action == 'add':
            telegram_id = params.get('telegram_id')
            username = params.get('username', '')
            
            if not telegram_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'telegram_id required'}),
                    'isBase64Encoded': False
                }
            
            dsn = os.environ.get('DATABASE_URL')
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            escaped_username = username.replace("'", "''")
            
            cur.execute(
                "INSERT INTO allowed_users (telegram_id, username) VALUES (" + str(telegram_id) + ", '" + escaped_username + "') ON CONFLICT (telegram_id) DO UPDATE SET username = '" + escaped_username + "' RETURNING id"
            )
            user_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user_id': user_id}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
