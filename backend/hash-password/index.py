import bcrypt
import json

def handler(event, context):
    # Password to hash
    password = "admin123"
    
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    # Return the hash as a string
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'password': password,
            'hash': hashed.decode('utf-8')
        }),
        'isBase64Encoded': False
    }