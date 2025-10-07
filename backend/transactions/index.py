import json
import os
import psycopg2
import urllib.request
from typing import Dict, Any
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление транзакциями и аналитика
    Args: event с httpMethod, body для создания транзакций
    Returns: HTTP response со списком транзакций или статистикой
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
        params = event.get('queryStringParameters', {})
        action = params.get('action', 'list')
        
        if action == 'stats':
            date_filter = params.get('date_filter', 'month')
            start_date = params.get('start_date')
            end_date = params.get('end_date')
            exchange_rate = float(params.get('exchange_rate', 82))
            
            if date_filter == 'today':
                today = datetime.now().date()
                date_condition = f'AND "transaction_date"::date = \'{today.isoformat()}\''
            elif date_filter == 'week':
                today = datetime.now().date()
                week_start = today - timedelta(days=today.weekday())
                date_condition = f'AND "transaction_date"::date >= \'{week_start.isoformat()}\''
            elif date_filter == 'month':
                today = datetime.now().date()
                month_start = today.replace(day=1)
                date_condition = f'AND "transaction_date"::date >= \'{month_start.isoformat()}\''
            elif date_filter == 'custom' and start_date and end_date:
                date_condition = f'AND "transaction_date"::date BETWEEN \'{start_date}\' AND \'{end_date}\''
            elif date_filter == 'all':
                date_condition = ""
            else:
                date_condition = ""
            
            cur.execute(f"""
                SELECT 
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN currency = 'USD' THEN amount * {exchange_rate} ELSE amount END) as total_revenue,
                    SUM(CASE WHEN currency = 'USD' THEN cost_price * {exchange_rate} ELSE cost_price END) as total_costs,
                    SUM(CASE WHEN currency = 'USD' THEN profit * {exchange_rate} ELSE profit END) as total_profit,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
                FROM transactions
                WHERE status = 'completed' {date_condition}
            """)
            stats = cur.fetchone()
            
            expenses_count = 0
            if date_filter == 'all':
                cur.execute("""
                    SELECT COUNT(*) FROM expenses 
                    WHERE status = 'active'
                """)
                exp_count = cur.fetchone()
                expenses_count = exp_count[0] if exp_count else 0
            elif date_condition:
                cur.execute(f"""
                    SELECT COUNT(*) FROM expenses 
                    WHERE status = 'active'
                    {date_condition.replace('transaction_date', 'start_date')}
                """)
                exp_count = cur.fetchone()
                expenses_count = exp_count[0] if exp_count else 0
            
            total_expenses = 0
            filter_start = None
            filter_end = None
            
            if date_filter == 'all':
                cur.execute("""
                    SELECT MIN("transaction_date"::date), MAX("transaction_date"::date)
                    FROM transactions
                    WHERE status = 'completed'
                """)
                date_range = cur.fetchone()
                if date_range and date_range[0] and date_range[1]:
                    filter_start = date_range[0].isoformat()
                    filter_end = date_range[1].isoformat()
            elif date_filter == 'today':
                filter_start = filter_end = today.isoformat()
            elif date_filter == 'week':
                filter_start = week_start.isoformat()
                filter_end = today.isoformat()
            elif date_filter == 'month':
                filter_start = month_start.isoformat()
                filter_end = today.isoformat()
            elif date_filter == 'custom' and start_date and end_date:
                filter_start = start_date
                filter_end = end_date
            
            if filter_start and filter_end:
                cur.execute(f"""
                    SELECT e.amount, e.start_date, e.end_date, e.distribution_type, e.currency
                    FROM expenses e
                    WHERE e.status = 'active'
                    AND e.start_date <= '{filter_end}'
                    AND (e.end_date IS NULL OR e.end_date >= '{filter_start}')
                """)
                expenses_for_period = cur.fetchall()
                
                for exp in expenses_for_period:
                    amount = float(exp[0])
                    exp_start = exp[1]
                    exp_end = exp[2]
                    dist_type = exp[3]
                    currency = exp[4] if len(exp) > 4 and exp[4] else 'RUB'
                    
                    if currency == 'USD':
                        amount = amount * exchange_rate
                    
                    if dist_type == 'one_time':
                        exp_date_str = exp_start.isoformat()
                        if filter_start <= exp_date_str <= filter_end:
                            total_expenses += amount
                    else:
                        actual_start = max(datetime.strptime(filter_start, '%Y-%m-%d').date(), exp_start)
                        actual_end = min(datetime.strptime(filter_end, '%Y-%m-%d').date(), exp_end) if exp_end else datetime.strptime(filter_end, '%Y-%m-%d').date()
                        
                        total_period_days = (exp_end - exp_start).days + 1 if exp_end else 365
                        filter_period_days = (actual_end - actual_start).days + 1
                        
                        if filter_period_days > 0:
                            total_expenses += (amount / total_period_days) * filter_period_days
            
            cur.execute(f"""
                SELECT p.name, COUNT(*) as sales_count, 
                    SUM(CASE WHEN t.currency = 'USD' THEN t.profit * {exchange_rate} ELSE t.profit END) as total_profit, 
                    SUM(CASE WHEN t.currency = 'USD' THEN t.amount * {exchange_rate} ELSE t.amount END) as total_revenue
                FROM transactions t
                LEFT JOIN products p ON t.product_id = p.id
                WHERE t.status = 'completed' {date_condition}
                GROUP BY p.name
                ORDER BY total_profit DESC
            """)
            product_stats = cur.fetchall()
            
            if date_filter == 'all':
                cur.execute("""
                    SELECT MIN("transaction_date"::date), MAX("transaction_date"::date)
                    FROM transactions WHERE status = 'completed'
                """)
                date_range = cur.fetchone()
                if date_range and date_range[0] and date_range[1]:
                    chart_start = date_range[0]
                    chart_end = date_range[1]
                else:
                    chart_start = chart_end = datetime.now().date()
            elif date_filter == 'today':
                chart_start = chart_end = today
            elif date_filter == 'week':
                chart_start = week_start
                chart_end = today
            elif date_filter == 'month':
                chart_start = month_start
                chart_end = today
            elif date_filter == 'custom' and start_date and end_date:
                chart_start = datetime.strptime(start_date, '%Y-%m-%d').date()
                chart_end = datetime.strptime(end_date, '%Y-%m-%d').date()
            else:
                chart_start = chart_end = datetime.now().date()
            
            days_count = (chart_end - chart_start).days + 1
            all_dates = [(chart_start + timedelta(days=i)).isoformat() for i in range(days_count)]
            
            cur.execute(f"""
                SELECT "transaction_date"::date as date, COUNT(*) as count, 
                    SUM(CASE WHEN currency = 'USD' THEN profit * {exchange_rate} ELSE profit END) as profit, 
                    SUM(CASE WHEN currency = 'USD' THEN amount * {exchange_rate} ELSE amount END) as revenue
                FROM transactions
                WHERE status = 'completed' {date_condition}
                GROUP BY "transaction_date"::date
            """)
            daily_stats_raw = cur.fetchall()
            
            product_analytics = []
            for row in product_stats:
                product_analytics.append({
                    'name': row[0],
                    'sales_count': row[1],
                    'total_profit': float(row[2]) if row[2] else 0,
                    'total_revenue': float(row[3]) if row[3] else 0
                })
            
            daily_map = {}
            for row in daily_stats_raw:
                daily_map[row[0].isoformat()] = {
                    'count': row[1],
                    'profit': float(row[2]) if row[2] else 0,
                    'revenue': float(row[3]) if row[3] else 0
                }
            
            cur.execute(f"""
                SELECT amount, start_date, end_date, distribution_type, currency
                FROM expenses
                WHERE status = 'active'
                AND start_date <= '{chart_end.isoformat()}'
                AND (end_date IS NULL OR end_date >= '{chart_start.isoformat()}')
            """)
            expenses_data = cur.fetchall()
            
            daily_expenses = {}
            for exp in expenses_data:
                amount = float(exp[0])
                exp_start = exp[1]
                exp_end = exp[2]
                dist_type = exp[3]
                currency = exp[4] if len(exp) > 4 and exp[4] else 'RUB'
                
                if currency == 'USD':
                    amount = amount * exchange_rate
                
                if dist_type == 'one_time':
                    date_key = exp_start.isoformat()
                    if chart_start <= exp_start <= chart_end:
                        daily_expenses[date_key] = daily_expenses.get(date_key, 0) + amount
                else:
                    actual_start = max(chart_start, exp_start)
                    actual_end = min(chart_end, exp_end) if exp_end else chart_end
                    total_days = (exp_end - exp_start).days + 1 if exp_end else 365
                    daily_amount = amount / total_days
                    
                    days_in_range = (actual_end - actual_start).days + 1
                    for i in range(days_in_range):
                        date_key = (actual_start + timedelta(days=i)).isoformat()
                        daily_expenses[date_key] = daily_expenses.get(date_key, 0) + daily_amount
            
            daily_analytics = []
            for date_str in all_dates:
                day_expenses = round(daily_expenses.get(date_str, 0), 2)
                if date_str in daily_map:
                    day_profit = daily_map[date_str]['profit']
                    daily_analytics.append({
                        'date': date_str,
                        'count': daily_map[date_str]['count'],
                        'profit': day_profit,
                        'revenue': daily_map[date_str]['revenue'],
                        'expenses': day_expenses,
                        'net_profit': round(day_profit - day_expenses, 2)
                    })
                else:
                    daily_analytics.append({
                        'date': date_str,
                        'count': 0,
                        'profit': 0,
                        'revenue': 0,
                        'expenses': day_expenses,
                        'net_profit': round(-day_expenses, 2)
                    })
            
            cur.close()
            conn.close()
            
            transaction_costs = float(stats[2]) if stats[2] else 0
            total_costs_with_expenses = transaction_costs + total_expenses
            revenue = float(stats[1]) if stats[1] else 0
            total_profit_adjusted = revenue - total_costs_with_expenses
            
            total_transaction_count = (stats[0] or 0) + expenses_count
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'total_transactions': total_transaction_count,
                    'total_revenue': revenue,
                    'total_costs': total_costs_with_expenses,
                    'total_profit': total_profit_adjusted,
                    'completed_count': stats[4] or 0,
                    'pending_count': stats[5] or 0,
                    'failed_count': stats[6] or 0,
                    'expenses_count': expenses_count,
                    'product_analytics': product_analytics,
                    'daily_analytics': daily_analytics
                }),
                'isBase64Encoded': False
            }
        
        cur.execute('''
            SELECT t.id, t.transaction_code, t.product_id, p.name, t.client_telegram, 
                   t.client_name, t.amount, t.cost_price, t.profit, t.status, 
                   t."transaction_date", t.notes, t.currency
            FROM transactions t
            LEFT JOIN products p ON t.product_id = p.id
            ORDER BY t."transaction_date" DESC
            LIMIT 100
        ''')
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
                'notes': row[11],
                'currency': row[12] if len(row) > 12 else 'RUB'
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
        currency = body_data.get('currency', 'RUB')
        transaction_date = body_data.get('transaction_date', datetime.now().strftime('%Y-%m-%d'))
        
        cur.execute(
            "SELECT cost_price, sale_price, cost_price_usd, sale_price_usd FROM products WHERE id = " + str(product_id)
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
        
        cost_price_rub = float(product[0])
        sale_price_rub = float(product[1])
        cost_price_usd = float(product[2]) if product[2] else None
        sale_price_usd = float(product[3]) if product[3] else None
        
        if currency == 'USD':
            if sale_price_usd is not None:
                cost_price = cost_price_usd if cost_price_usd is not None else 0
                sale_price = float(custom_amount) if custom_amount else sale_price_usd
            else:
                cost_price = cost_price_rub
                sale_price = float(custom_amount) if custom_amount else sale_price_rub
        else:
            cost_price = cost_price_rub
            sale_price = float(custom_amount) if custom_amount else sale_price_rub
        
        profit = sale_price - cost_price
        
        import random
        transaction_code = 'TX-' + datetime.now().strftime('%Y%m%d%H%M%S') + '-' + str(random.randint(1000, 9999))
        
        cur.execute(
            "INSERT INTO transactions (transaction_code, product_id, client_telegram, client_name, amount, cost_price, profit, status, notes, currency, transaction_date) VALUES ('" + transaction_code + "', " + str(product_id) + ", '" + client_telegram + "', '" + client_name + "', " + str(sale_price) + ", " + str(cost_price) + ", " + str(profit) + ", '" + status + "', '" + notes + "', '" + currency + "', '" + transaction_date + "') RETURNING id"
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
    
    if method == 'DELETE':
        params = event.get('queryStringParameters', {})
        transaction_id = params.get('id')
        
        cur.execute(
            "DELETE FROM transactions WHERE id = " + str(transaction_id)
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