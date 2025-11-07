import json
import psycopg2
import os
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Returns detailed breakdown of costs for a specific date
    Args: event with date parameter, context with request_id
    Returns: JSON with transaction costs and expenses breakdown
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {})
    date_str = params.get('date')
    exchange_rate = float(params.get('exchange_rate', 82))
    
    if not date_str:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Date parameter is required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    result = {
        'date': date_str,
        'transaction_costs': [],
        'expenses': [],
        'total_transaction_costs': 0,
        'total_expenses': 0,
        'total_costs': 0
    }
    
    cur.execute('''
        SELECT t.id, t.transaction_code, p.name as product_name, 
               t.amount, t.cost_price, t.currency, t.client_name
        FROM transactions t
        LEFT JOIN products p ON t.product_id = p.id
        WHERE t.status = 'completed' 
        AND t.transaction_date::date = %s
        ORDER BY t.transaction_date
    ''', (date_str,))
    
    for row in cur.fetchall():
        trans_id, code, product, amount, cost_price, currency, client = row
        
        amount_rub = float(amount) * exchange_rate if currency == 'USD' else float(amount)
        cost_rub = float(cost_price) * exchange_rate if currency == 'USD' else float(cost_price)
        
        result['transaction_costs'].append({
            'id': trans_id,
            'code': code,
            'product': product,
            'client': client or 'Не указан',
            'amount': float(amount_rub),
            'cost_price': float(cost_rub),
            'currency': currency
        })
        result['total_transaction_costs'] += float(cost_rub)
    
    target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    
    cur.execute('''
        SELECT e.id, et.name as expense_type, e.amount, e.description,
               e.start_date, e.end_date, e.distribution_type, e.currency
        FROM expenses e
        LEFT JOIN expense_types et ON e.expense_type_id = et.id
        WHERE e.status = 'active'
        AND e.start_date <= %s
        AND (e.end_date IS NULL OR e.end_date >= %s)
        ORDER BY e.start_date
    ''', (date_str, date_str))
    
    for row in cur.fetchall():
        exp_id, exp_type, amount, desc, start_date, end_date, dist_type, currency = row
        
        amount_float = float(amount)
        amount_rub = amount_float * exchange_rate if currency == 'USD' else amount_float
        
        if dist_type == 'one_time':
            if start_date == target_date:
                daily_amount = amount_rub
            else:
                continue
        else:
            if end_date:
                total_days = (end_date - start_date).days + 1
            else:
                total_days = 365
            daily_amount = amount_rub / total_days
        
        result['expenses'].append({
            'id': exp_id,
            'type': exp_type,
            'description': desc or '',
            'amount': round(daily_amount, 2),
            'distribution_type': dist_type,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat() if end_date else None,
            'currency': currency
        })
        result['total_expenses'] += daily_amount
    
    result['total_expenses'] = round(result['total_expenses'], 2)
    result['total_costs'] = round(result['total_transaction_costs'] + result['total_expenses'], 2)
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(result)
    }