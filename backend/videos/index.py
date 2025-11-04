import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage wedding videos - get list and update video URLs
    Args: event with httpMethod (GET/PUT/OPTIONS), body for PUT requests
    Returns: JSON with videos list or update confirmation (v2 with CORS fix)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        if method == 'GET':
            cursor.execute('''
                SELECT id, title, url, display_order 
                FROM wedding_videos 
                ORDER BY display_order
            ''')
            rows = cursor.fetchall()
            
            videos = [
                {
                    'id': row[0],
                    'title': row[1],
                    'url': row[2],
                    'display_order': row[3]
                }
                for row in rows
            ]
            
            return {
                'statusCode': 200,
                'headers': headers,
                'isBase64Encoded': False,
                'body': json.dumps({'videos': videos})
            }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            video_id = body_data.get('id')
            url = body_data.get('url')
            
            if not video_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Video ID required'}),
                    'isBase64Encoded': False
                }
            
            if url:
                cursor.execute('''
                    UPDATE wedding_videos 
                    SET url = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = %s
                ''', (url, video_id))
            else:
                cursor.execute('''
                    UPDATE wedding_videos 
                    SET url = NULL, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = %s
                ''', (video_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'message': 'Video updated'})
            }
        
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
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()