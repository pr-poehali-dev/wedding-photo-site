import json
import os
import psycopg2
from typing import Dict, Any

def get_db_connection():
    '''Get database connection using DATABASE_URL secret'''
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage wedding photos - get list, add, delete, reorder
    Args: event with httpMethod (GET/POST/DELETE/PUT), body for POST/PUT
    Returns: JSON response with photos list or operation status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            admin_mode = params.get('admin') == 'true'
            photo_id = params.get('id')
            
            if photo_id:
                cur.execute('SELECT id, url, alt, display_order FROM wedding_photos WHERE id = %s', (photo_id,))
                row = cur.fetchone()
                if row:
                    photo = {'id': row[0], 'url': row[1], 'alt': row[2], 'display_order': row[3]}
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps(photo),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Photo not found'}),
                        'isBase64Encoded': False
                    }
            
            if admin_mode:
                cur.execute('SELECT id, SUBSTRING(url, 1, 100) as url_preview, alt, display_order, LENGTH(url) as size FROM wedding_photos ORDER BY display_order ASC')
                rows = cur.fetchall()
                photos = [
                    {'id': row[0], 'url': row[1], 'alt': row[2], 'display_order': row[3], 'size': row[4]}
                    for row in rows
                ]
            else:
                cur.execute('SELECT id, alt, display_order FROM wedding_photos ORDER BY display_order ASC')
                rows = cur.fetchall()
                photos = [
                    {'id': row[0], 'alt': row[1], 'display_order': row[2]}
                    for row in rows
                ]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'photos': photos}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            url = body_data.get('url', '')
            alt = body_data.get('alt', 'Свадебное фото')
            
            cur.execute('SELECT COALESCE(MAX(display_order), 0) + 1 FROM wedding_photos')
            next_order = cur.fetchone()[0]
            
            cur.execute(
                'INSERT INTO wedding_photos (url, alt, display_order) VALUES (%s, %s, %s) RETURNING id',
                (url, alt, next_order)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'id': new_id, 'message': 'Photo added'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            photo_id = params.get('id')
            
            if not photo_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Photo ID required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('DELETE FROM wedding_photos WHERE id = %s', (photo_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Photo deleted'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            photo_orders = body_data.get('orders', [])
            
            for item in photo_orders:
                photo_id = item.get('id')
                new_order = item.get('display_order')
                cur.execute(
                    'UPDATE wedding_photos SET display_order = %s WHERE id = %s',
                    (new_order, photo_id)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'message': 'Photos reordered'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()