"""API для сохранения и получения картинок карточек (S3 + БД)"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True
    return conn

def get_s3():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # GET /card_images?key=step1 — получить все картинки для шага
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        step_key = params.get('key', '')
        if not step_key:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'key required'})}

        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = get_db()
        cur = conn.cursor()
        cur.execute(f'SELECT id, url FROM {schema}.card_images WHERE key = %s', (step_key,))
        rows = cur.fetchall()
        conn.close()

        images = {row[0]: row[1] for row in rows}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'images': images})}

    # POST /card_images — сохранить картинку
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        step_key = body.get('key', '')
        card_id = body.get('id', '')
        image_data = body.get('image', '')  # base64 или URL

        if not step_key or not card_id or not image_data:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'key, id, image required'})}

        # Если base64 — загружаем в S3
        if image_data.startswith('data:'):
            header, b64 = image_data.split(',', 1)
            ext = 'jpg' if 'jpeg' in header else 'png' if 'png' in header else 'jpg'
            img_bytes = base64.b64decode(b64)
            s3_key = f'card_images/{step_key}/{card_id}/{uuid.uuid4().hex[:8]}.{ext}'

            s3 = get_s3()
            s3.put_object(
                Bucket='files',
                Key=s3_key,
                Body=img_bytes,
                ContentType=f'image/{ext}',
            )
            access_key = os.environ['AWS_ACCESS_KEY_ID']
            url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{s3_key}'
        else:
            url = image_data  # уже URL

        # Сохраняем URL в БД
        schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f'''INSERT INTO {schema}.card_images (key, id, url, updated_at)
                VALUES (%s, %s, %s, NOW())
                ON CONFLICT (key, id) DO UPDATE SET url = EXCLUDED.url, updated_at = NOW()''',
            (step_key, card_id, url)
        )
        conn.close()

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'url': url})}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'method not allowed'})}
