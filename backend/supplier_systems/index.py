"""API для чтения и сохранения типов монтажа по системам поставщиков"""
import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
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

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    # GET — вернуть все записи: { supplier_code: { system_index: { mount_types, ... } } }
    if method == 'GET':
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f'SELECT supplier_code, system_index, system_name, voltage, wires, mount_types '
            f'FROM {SCHEMA}.supplier_systems ORDER BY supplier_code, system_index'
        )
        rows = cur.fetchall()
        conn.close()

        result = {}
        for supplier_code, system_index, system_name, voltage, wires, mount_types in rows:
            if supplier_code not in result:
                result[supplier_code] = {}
            result[supplier_code][system_index] = {
                'name': system_name,
                'voltage': voltage,
                'wires': wires,
                'types': mount_types or [],
            }

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(result)}

    # POST — сохранить одну систему
    # body: { supplier_code, system_index, system_name, voltage, wires, types: [] }
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        supplier_code = body.get('supplier_code', '')
        system_index  = body.get('system_index', 0)
        system_name   = body.get('system_name', '')
        voltage       = body.get('voltage', '')
        wires         = body.get('wires', '')
        types         = body.get('types', [])

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            f'''INSERT INTO {SCHEMA}.supplier_systems
                (supplier_code, system_index, system_name, voltage, wires, mount_types, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (supplier_code, system_index)
                DO UPDATE SET system_name=EXCLUDED.system_name, voltage=EXCLUDED.voltage,
                              wires=EXCLUDED.wires, mount_types=EXCLUDED.mount_types, updated_at=NOW()''',
            (supplier_code, system_index, system_name, voltage, wires, types)
        )
        conn.close()

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'method not allowed'})}
