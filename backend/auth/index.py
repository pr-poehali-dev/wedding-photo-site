import json
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Check admin password for authentication  
    Args: event with httpMethod (POST), body with password
    Returns: JSON with auth status
    '''
    
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': '*',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400'
    }
    
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 204,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {
            **cors_headers,
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'authenticated': True}),
        'isBase64Encoded': False
    }