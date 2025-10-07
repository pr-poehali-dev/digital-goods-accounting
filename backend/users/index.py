import json
import os
import psycopg2
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: User authentication and management
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
            'body': ''
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
                email = body.get('email')
                password = body.get('password')
                
                cur.execute("""
                    SELECT id, email, password_hash, full_name, is_admin, is_active 
                    FROM users WHERE email = %s
                """, (email,))
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'})
                    }
                
                user_id, user_email, password_hash, full_name, is_admin, is_active = user
                
                if not is_active:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Account is disabled'})
                    }
                
                if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid credentials'})
                    }
                
                cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.now(), user_id))
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
                    })
                }
            
            elif action == 'verify':
                token = body.get('token')
                try:
                    payload = jwt.decode(token, jwt_secret, algorithms=['HS256'])
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': True, 'user': payload})
                    }
                except jwt.ExpiredSignatureError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': False, 'error': 'Token expired'})
                    }
                except jwt.InvalidTokenError:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'valid': False, 'error': 'Invalid token'})
                    }
        
        elif method == 'GET':
            auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'})
                }
            
            try:
                payload = jwt.decode(auth_token, jwt_secret, algorithms=['HS256'])
                
                if not payload.get('is_admin'):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'})
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
                    'body': json.dumps({'users': users_list})
                }
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'})
                }
        
        elif method == 'PUT':
            auth_token = event.get('headers', {}).get('X-Auth-Token') or event.get('headers', {}).get('x-auth-token')
            
            if not auth_token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'})
                }
            
            try:
                payload = jwt.decode(auth_token, jwt_secret, algorithms=['HS256'])
                
                if not payload.get('is_admin'):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Admin access required'})
                    }
                
                body = json.loads(event.get('body', '{}'))
                action = body.get('action')
                
                if action == 'create':
                    email = body.get('email')
                    password = body.get('password')
                    full_name = body.get('full_name')
                    is_admin = body.get('is_admin', False)
                    
                    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    cur.execute("""
                        INSERT INTO users (email, password_hash, full_name, is_admin) 
                        VALUES (%s, %s, %s, %s) RETURNING id
                    """, (email, password_hash, full_name, is_admin))
                    new_id = cur.fetchone()[0]
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'id': new_id, 'message': 'User created'})
                    }
                
                elif action == 'update':
                    user_id = body.get('user_id')
                    updates = {}
                    
                    if 'is_active' in body:
                        updates['is_active'] = body['is_active']
                    if 'is_admin' in body:
                        updates['is_admin'] = body['is_admin']
                    if 'password' in body:
                        updates['password_hash'] = bcrypt.hashpw(body['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    
                    if updates:
                        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
                        cur.execute(f"UPDATE users SET {set_clause} WHERE id = %s", 
                                  list(updates.values()) + [user_id])
                        conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'message': 'User updated'})
                    }
                
            except jwt.InvalidTokenError:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid token'})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()
