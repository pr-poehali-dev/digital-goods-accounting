import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: User authentication - email/password login and user management
    Args: event with httpMethod, body, headers
    Returns: HTTP response with auth tokens or user data
    """
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    jwt_secret = os.environ.get('JWT_SECRET', 'default-secret-change-in-production')
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'login':
                email = body.get('email', '').replace("'", "''")
                password = body.get('password', '')
                
                cur.execute(f"""
                    SELECT id, email, password_hash, full_name, is_admin, is_active 
                    FROM users WHERE email = '{email}'
                """)
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
                
                user_id, user_email, password_hash, full_name, is_admin, is_active = user
                
                if not is_active:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Account is disabled'}),
                        'isBase64Encoded': False
                    }
                
                if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'}),
                        'isBase64Encoded': False
                    }
                
                now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                cur.execute(f"UPDATE users SET last_login = '{now}' WHERE id = {user_id}")
                conn.commit()
                
                token = jwt.encode({
                    'user_id': user_id,
                    'email': user_email,
                    'is_admin': is_admin,
                    'exp': datetime.utcnow() + timedelta(days=7)
                }, jwt_secret, algorithm='HS256')
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'token': token,
                        'user': {
                            'id': user_id,
                            'email': user_email,
                            'full_name': full_name,
                            'is_admin': is_admin
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'reset_password':
                email = body.get('email', '').replace("'", "''")
                new_password = body.get('new_password', '')
                
                if not email or not new_password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Email and password required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT id FROM users WHERE email = '{email}'")
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'User not found'}),
                        'isBase64Encoded': False
                    }
                
                user_id = user[0]
                password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                
                cur.execute(f"UPDATE users SET password_hash = '{password_hash}' WHERE id = {user_id}")
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Password reset successful'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'verify':
                token = body.get('token')
                try:
                    payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': True, 'user': payload}),
                        'isBase64Encoded': False
                    }
                except jwt.ExpiredSignatureError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': False, 'error': 'Token expired'}),
                        'isBase64Encoded': False
                    }
                except jwt.InvalidTokenError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': False, 'error': 'Invalid token'}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action', '')
            
            if action == 'users':
                auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
                
                if not auth_token:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'No token provided'}),
                        'isBase64Encoded': False
                    }
                
                try:
                    payload = jwt.decode(auth_token, jwt_secret, algorithms=['HS256'])
                    
                    if not payload.get('is_admin'):
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Admin access required'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute("""
                        SELECT id, email, full_name, is_admin, is_active, created_at, last_login 
                        FROM users ORDER BY created_at DESC
                    """)
                    users = cur.fetchall()
                    
                    users_list = [{
                        'id': u[0],
                        'email': u[1],
                        'full_name': u[2],
                        'is_admin': u[3],
                        'is_active': u[4],
                        'created_at': u[5].isoformat() if u[5] else None,
                        'last_login': u[6].isoformat() if u[6] else None
                    } for u in users]
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'users': users_list}),
                        'isBase64Encoded': False
                    }
                except jwt.InvalidTokenError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid token'}),
                        'isBase64Encoded': False
                    }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'}),
                    'isBase64Encoded': False
                }
            
            try:
                payload = jwt.decode(auth_token, jwt_secret, algorithms=['HS256'])
                
                if not payload.get('is_admin'):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'}),
                        'isBase64Encoded': False
                    }
                
                body = json.loads(event.get('body', '{}'))
                action = body.get('action')
                
                if action == 'create':
                    email = body.get('email', '').replace("'", "''")
                    password = body.get('password', '')
                    full_name = body.get('full_name', '').replace("'", "''")
                    is_admin = body.get('is_admin', False)
                    
                    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    cur.execute(f"""
                        INSERT INTO users (email, password_hash, full_name, is_admin) 
                        VALUES ('{email}', '{password_hash}', '{full_name}', {is_admin}) RETURNING id
                    """)
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'id': new_id, 'message': 'User created'}),
                        'isBase64Encoded': False
                    }
                
                elif action == 'update':
                    user_id = int(body.get('user_id', 0))
                    updates = []
                    
                    if 'is_active' in body:
                        updates.append(f"is_active = {body['is_active']}")
                    if 'is_admin' in body:
                        updates.append(f"is_admin = {body['is_admin']}")
                    if 'password' in body and body['password']:
                        password_hash = bcrypt.hashpw(body['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                        updates.append(f"password_hash = '{password_hash}'")
                    
                    if updates:
                        set_clause = ', '.join(updates)
                        cur.execute(f"UPDATE users SET {set_clause} WHERE id = {user_id}")
                        conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'User updated'}),
                        'isBase64Encoded': False
                    }
                
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()