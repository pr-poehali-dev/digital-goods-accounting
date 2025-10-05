import json
import urllib.request
from typing import Dict, Any
from datetime import date

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получение актуального курса доллара с ЦБ РФ
    Args: event с httpMethod
    Returns: HTTP response с текущим курсом USD/RUB
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
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        today = date.today().isoformat()
        
        try:
            url = 'https://www.cbr-xml-daily.ru/daily_json.js'
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read().decode())
                usd_rate = data['Valute']['USD']['Value']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'rate': usd_rate, 'date': today, 'source': 'cbr'}),
                    'isBase64Encoded': False
                }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Failed to get exchange rate', 'details': str(e), 'fallback_rate': 95.50}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
