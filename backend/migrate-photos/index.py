"""
Business: Migrate photos from base64 to external CDN
Args: event with API key and batch settings
Returns: Migration results with uploaded URLs
"""
import json
import os
import base64
import psycopg2
from typing import Dict, Any
import requests


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    if method == 'GET':
        try:
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            cur.execute("""
                SELECT id, url, thumbnail_url, alt, 
                       cdn_full_url, cdn_thumbnail_url
                FROM wedding_photos 
                WHERE cdn_full_url IS NULL OR cdn_thumbnail_url IS NULL
                ORDER BY display_order
                LIMIT 50
            """)
            
            rows = cur.fetchall()
            photos = []
            
            for row in rows:
                photos.append({
                    'id': row[0],
                    'has_url': len(row[1]) if row[1] else 0,
                    'has_thumbnail': len(row[2]) if row[2] else 0,
                    'alt': row[3],
                    'cdn_full_url': row[4],
                    'cdn_thumbnail_url': row[5]
                })
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'total': len(photos),
                    'photos': photos
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    if method == 'POST':
        try:
            body_data = json.loads(event.get('body', '{}'))
            api_key = body_data.get('api_key')
            photo_id = body_data.get('photo_id')
            
            if not api_key or not photo_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'api_key and photo_id required'})
                }
            
            conn = psycopg2.connect(dsn)
            cur = conn.cursor()
            
            cur.execute("""
                SELECT url, thumbnail_url, alt 
                FROM wedding_photos 
                WHERE id = %s
            """, (photo_id,))
            
            row = cur.fetchone()
            if not row:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Photo not found'})
                }
            
            full_url_b64 = row[0]
            thumb_url_b64 = row[1]
            alt = row[2]
            
            cdn_full_url = None
            cdn_thumb_url = None
            
            if full_url_b64 and full_url_b64.startswith('data:image'):
                try:
                    image_data = full_url_b64.split(',')[1]
                    response = requests.post(
                        f'https://api.imgbb.com/1/upload?key={api_key}',
                        data={'image': image_data, 'name': f'wedding_full_{photo_id}'},
                        timeout=30
                    )
                    if response.ok:
                        result = response.json()
                        cdn_full_url = result['data']['url']
                except Exception as e:
                    print(f'Failed to upload full image: {e}')
            
            if thumb_url_b64 and thumb_url_b64.startswith('data:image'):
                try:
                    image_data = thumb_url_b64.split(',')[1]
                    response = requests.post(
                        f'https://api.imgbb.com/1/upload?key={api_key}',
                        data={'image': image_data, 'name': f'wedding_thumb_{photo_id}'},
                        timeout=30
                    )
                    if response.ok:
                        result = response.json()
                        cdn_thumb_url = result['data']['url']
                except Exception as e:
                    print(f'Failed to upload thumbnail: {e}')
            
            if cdn_full_url or cdn_thumb_url:
                update_parts = []
                params = []
                
                if cdn_full_url:
                    update_parts.append('cdn_full_url = %s')
                    params.append(cdn_full_url)
                
                if cdn_thumb_url:
                    update_parts.append('cdn_thumbnail_url = %s')
                    params.append(cdn_thumb_url)
                
                params.append(photo_id)
                
                cur.execute(f"""
                    UPDATE wedding_photos 
                    SET {', '.join(update_parts)}
                    WHERE id = %s
                """, params)
                
                conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True,
                    'photo_id': photo_id,
                    'cdn_full_url': cdn_full_url,
                    'cdn_thumbnail_url': cdn_thumb_url
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Method not allowed'})
    }
