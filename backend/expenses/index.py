import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление расходными транзакциями с распределением по периодам
    Args: event с httpMethod, body для создания расходов
    Returns: HTTP response со списком расходов или статистикой
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
        params = event.get('queryStringParameters', {}) or {}
        action = params.get('action', 'list')
        
        if action == 'types':
            cur.execute("SELECT id, name, description FROM expense_types ORDER BY name")
            rows = cur.fetchall()
            
            types = []
            for row in rows:
                types.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'expense_types': types}),
                'isBase64Encoded': False
            }
        
        if action == 'daily':
            start_date = params.get('start_date')
            end_date = params.get('end_date')
            
            if not start_date or not end_date:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'start_date and end_date required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT e.id, e.amount, e.start_date, e.end_date, e.distribution_type, et.name
                FROM expenses e
                LEFT JOIN expense_types et ON e.expense_type_id = et.id
                WHERE e.status = 'active'
                AND e.start_date <= '" + end_date + "'
                AND (e.end_date IS NULL OR e.end_date >= '" + start_date + "')
            """)
            rows = cur.fetchall()
            
            daily_expenses = {}
            
            for row in rows:
                expense_id = row[0]
                amount = float(row[1])
                exp_start = row[2]
                exp_end = row[3]
                dist_type = row[4]
                type_name = row[5]
                
                if dist_type == 'one_time':
                    date_key = exp_start.isoformat()
                    if date_key not in daily_expenses:
                        daily_expenses[date_key] = 0
                    daily_expenses[date_key] += amount
                else:
                    actual_start = max(datetime.strptime(start_date, '%Y-%m-%d').date(), exp_start)
                    actual_end = min(datetime.strptime(end_date, '%Y-%m-%d').date(), exp_end) if exp_end else datetime.strptime(end_date, '%Y-%m-%d').date()
                    
                    days_count = (actual_end - actual_start).days + 1
                    if days_count > 0:
                        daily_amount = amount / days_count
                        
                        current_date = actual_start
                        while current_date <= actual_end:
                            date_key = current_date.isoformat()
                            if date_key not in daily_expenses:
                                daily_expenses[date_key] = 0
                            daily_expenses[date_key] += daily_amount
                            current_date += timedelta(days=1)
            
            result = []
            for date_str, total in daily_expenses.items():
                result.append({
                    'date': date_str,
                    'total_expense': round(total, 2)
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'daily_expenses': sorted(result, key=lambda x: x['date'])}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT e.id, e.expense_type_id, et.name, e.amount, e.description, 
                   e.start_date, e.end_date, e.distribution_type, e.status, e.currency
            FROM expenses e
            LEFT JOIN expense_types et ON e.expense_type_id = et.id
            ORDER BY e.created_at DESC
            LIMIT 100
        """)
        rows = cur.fetchall()
        
        expenses = []
        for row in rows:
            expenses.append({
                'id': row[0],
                'expense_type_id': row[1],
                'expense_type_name': row[2],
                'amount': float(row[3]),
                'description': row[4],
                'start_date': row[5].isoformat() if row[5] else None,
                'end_date': row[6].isoformat() if row[6] else None,
                'distribution_type': row[7],
                'status': row[8],
                'currency': row[9] if len(row) > 9 and row[9] else 'RUB'
            })
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'expenses': expenses}),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action', 'create_expense')
        
        if action == 'create_type':
            name = body_data.get('name')
            description = body_data.get('description', '')
            
            cur.execute(
                "INSERT INTO expense_types (name, description) VALUES ('" + name + "', '" + description + "') RETURNING id"
            )
            type_id = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': type_id}),
                'isBase64Encoded': False
            }
        
        expense_type_id = body_data.get('expense_type_id')
        amount = body_data.get('amount')
        description = body_data.get('description', '')
        start_date = body_data.get('start_date')
        end_date = body_data.get('end_date')
        distribution_type = body_data.get('distribution_type', 'one_time')
        currency = body_data.get('currency', 'RUB')
        
        end_date_sql = "'" + end_date + "'" if end_date else 'NULL'
        
        cur.execute(
            "INSERT INTO expenses (expense_type_id, amount, description, start_date, end_date, distribution_type, currency) VALUES (" 
            + str(expense_type_id) + ", " + str(amount) + ", '" + description + "', '" + start_date + "', " + end_date_sql + ", '" + distribution_type + "', '" + currency + "') RETURNING id"
        )
        expense_id = cur.fetchone()[0]
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'id': expense_id}),
            'isBase64Encoded': False
        }
    
    if method == 'DELETE':
        params = event.get('queryStringParameters', {}) or {}
        expense_id = params.get('id')
        action = params.get('action', 'delete_expense')
        
        if action == 'delete_type':
            type_id = params.get('type_id')
            cur.execute("DELETE FROM expense_types WHERE id = " + str(type_id))
        else:
            cur.execute("DELETE FROM expenses WHERE id = " + str(expense_id))
        
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