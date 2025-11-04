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
    Returns: JSON response with photos list or operation status (v2 with CORS fix)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    }
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            admin_mode = params.get('admin') == 'true'
            photo_id = params.get('id')
            
            if photo_id:
                cur.execute(f'SELECT id, url, thumbnail_url, cdn_full_url, cdn_thumbnail_url, alt, display_order FROM wedding_photos WHERE id = {int(photo_id)}')
                row = cur.fetchone()
                if row:
                    photo = {'id': row[0], 'url': row[1], 'thumbnail_url': row[2], 'cdn_full_url': row[3], 'cdn_thumbnail_url': row[4], 'alt': row[5], 'display_order': row[6]}
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(photo),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'Photo not found'}),
                        'isBase64Encoded': False
                    }
            
            if admin_mode:
                cur.execute('SELECT id, SUBSTRING(url, 1, 100) as url_preview, thumbnail_url, cdn_full_url, cdn_thumbnail_url, alt, display_order, LENGTH(url) as size FROM wedding_photos ORDER BY display_order ASC')
                rows = cur.fetchall()
                photos = [
                    {'id': row[0], 'url': row[1], 'thumbnail_url': row[2], 'cdn_full_url': row[3], 'cdn_thumbnail_url': row[4], 'alt': row[5], 'display_order': row[6], 'size': row[7]}
                    for row in rows
                ]
            else:
                cur.execute('SELECT id, url, thumbnail_url, cdn_full_url, cdn_thumbnail_url, alt, display_order FROM wedding_photos ORDER BY display_order ASC')
                rows = cur.fetchall()
                photos = [
                    {'id': row[0], 'url': row[1], 'thumbnail_url': row[2], 'cdn_full_url': row[3], 'cdn_thumbnail_url': row[4], 'alt': row[5], 'display_order': row[6]}
                    for row in rows
                ]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'photos': photos}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            url = body_data.get('url', '').replace("'", "''")
            thumbnail_url = body_data.get('thumbnail_url', url).replace("'", "''")
            alt = body_data.get('alt', 'Свадебное фото').replace("'", "''")
            
            cur.execute('SELECT COALESCE(MAX(display_order), 0) + 1 FROM wedding_photos')
            next_order = cur.fetchone()[0]
            
            cur.execute(f"""
                INSERT INTO wedding_photos (url, thumbnail_url, alt, display_order) 
                VALUES ('{url}', '{thumbnail_url}', '{alt}', {next_order}) 
                RETURNING id
            """)
            new_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': headers,
                'body': json.dumps({'success': True, 'id': new_id, 'message': 'Photo added'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            photo_id = params.get('id')
            
            if not photo_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Photo ID required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f'DELETE FROM wedding_photos WHERE id = {int(photo_id)}')
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Photo deleted'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            photo_orders = body_data.get('orders', [])
            
            for item in photo_orders:
                photo_id = int(item.get('id'))
                new_order = int(item.get('display_order'))
                cur.execute(f"""
                    UPDATE wedding_photos 
                    SET display_order = {new_order} 
                    WHERE id = {photo_id}
                """)
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Photos reordered'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()