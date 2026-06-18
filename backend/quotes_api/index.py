"""
API для управления счетами/заказами PRO-TREK.
Создание, получение, обновление счетов и смена статуса.
"""
import json
import os
from datetime import date, datetime
import psycopg2

SCHEMA = 't_p99554134_pro_trek_system_buil'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def json_serial(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def resp(data, code=200):
    return {
        'statusCode': code,
        'headers': {**CORS, 'Content-Type': 'application/json'},
        'body': json.dumps(data, ensure_ascii=False, default=json_serial),
    }

def handler(event: dict, context) -> dict:
    """
    GET  /quotes_api                        — список счетов
    GET  /quotes_api?id=123                 — один счёт
    GET  /quotes_api?statuses=1             — справочник статусов
    POST /quotes_api  body: {quote fields}  — создать счёт
    PUT  /quotes_api  body: {id, ...fields} — обновить счёт / сменить статус
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(
        os.environ['DATABASE_URL'],
        options=f"-c search_path={SCHEMA}"
    )
    cur = conn.cursor()

    try:
        if method == 'GET':
            p = event.get('queryStringParameters') or {}

            # Справочник статусов
            if p.get('statuses'):
                cur.execute("SELECT code, label, color, sort_order, is_terminal FROM quote_statuses ORDER BY sort_order")
                statuses = [{'code': r[0], 'label': r[1], 'color': r[2], 'sort_order': r[3], 'is_terminal': r[4]}
                            for r in cur.fetchall()]
                return resp({'statuses': statuses})

            # Один счёт
            if p.get('id'):
                cur.execute("""
                    SELECT q.*, qs.label as status_label, qs.color as status_color
                    FROM quotes q
                    LEFT JOIN quote_statuses qs ON qs.code = q.status
                    WHERE q.id = %s
                """, (int(p['id']),))
                cols = [d[0] for d in cur.description]
                row = cur.fetchone()
                if not row:
                    return resp({'error': 'Not found'}, 404)
                quote = dict(zip(cols, row))

                # История
                cur.execute("""
                    SELECT h.status, h.comment, h.changed_at, h.changed_by,
                           qs.label, qs.color
                    FROM quote_history h
                    LEFT JOIN quote_statuses qs ON qs.code = h.status
                    WHERE h.quote_id = %s ORDER BY h.changed_at DESC
                """, (quote['id'],))
                quote['history'] = [
                    {'status': r[0], 'comment': r[1], 'changed_at': r[2],
                     'changed_by': r[3], 'status_label': r[4], 'status_color': r[5]}
                    for r in cur.fetchall()
                ]
                return resp({'quote': quote})

            # Список
            session_id = p.get('session_id', '')
            status_filter = p.get('status', '')
            limit = min(int(p.get('limit') or 50), 200)

            where = ["1=1"]
            args = []
            if session_id:
                where.append("q.session_id = %s"); args.append(session_id)
            if status_filter:
                where.append("q.status = %s"); args.append(status_filter)

            cur.execute(f"""
                SELECT q.id, q.number, q.status, q.client_name, q.client_phone,
                       q.client_company, q.object_name, q.total_amount,
                       q.created_at, q.updated_at, q.valid_until,
                       qs.label as status_label, qs.color as status_color
                FROM quotes q
                LEFT JOIN quote_statuses qs ON qs.code = q.status
                WHERE {' AND '.join(where)}
                ORDER BY q.updated_at DESC LIMIT %s
            """, args + [limit])
            cols = [d[0] for d in cur.description]
            quotes = [dict(zip(cols, r)) for r in cur.fetchall()]
            return resp({'quotes': quotes, 'total': len(quotes)})

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')

            # Генерируем номер счёта
            cur.execute("SELECT nextval('quote_number_seq')")
            seq = cur.fetchone()[0]
            year = datetime.now().year
            number = body.get('number') or f"QT-{year}-{seq:04d}"

            cur.execute("""
                INSERT INTO quotes (
                    number, status, session_id,
                    client_name, client_phone, client_email, client_company, client_address,
                    object_name, object_address, room_type,
                    manager_name, manager_phone,
                    valid_until, total_amount, discount_pct, tax_pct, notes, project_id
                ) VALUES (
                    %s,%s,%s, %s,%s,%s,%s,%s, %s,%s,%s, %s,%s, %s,%s,%s,%s,%s,%s
                ) RETURNING id, number
            """, (
                number,
                body.get('status', 'draft'),
                body.get('session_id', 'anon'),
                body.get('client_name'),  body.get('client_phone'),
                body.get('client_email'), body.get('client_company'),
                body.get('client_address'),
                body.get('object_name'),  body.get('object_address'),
                body.get('room_type'),
                body.get('manager_name'), body.get('manager_phone'),
                body.get('valid_until'),
                body.get('total_amount'), body.get('discount_pct', 0),
                body.get('tax_pct', 0),  body.get('notes'),
                body.get('project_id'),
            ))
            row = cur.fetchone()
            quote_id, quote_number = row[0], row[1]

            # Пишем в историю
            cur.execute("""
                INSERT INTO quote_history (quote_id, status, comment, changed_by)
                VALUES (%s, %s, %s, %s)
            """, (quote_id, body.get('status', 'draft'), 'Счёт создан', body.get('manager_name', 'system')))

            conn.commit()
            return resp({'id': quote_id, 'number': quote_number})

        elif method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            quote_id = body.get('id')
            if not quote_id:
                return resp({'error': 'id required'}, 400)

            # Текущий статус (для истории)
            cur.execute("SELECT status FROM quotes WHERE id=%s", (int(quote_id),))
            row = cur.fetchone()
            if not row:
                return resp({'error': 'Not found'}, 404)
            old_status = row[0]

            fields, args = [], []
            for f in ['client_name','client_phone','client_email','client_company',
                      'client_address','object_name','object_address','room_type',
                      'manager_name','manager_phone','valid_until','total_amount',
                      'discount_pct','tax_pct','notes','project_id']:
                if f in body:
                    fields.append(f"{f} = %s"); args.append(body[f])

            new_status = body.get('status')
            if new_status and new_status != old_status:
                fields.append("status = %s"); args.append(new_status)

            fields.append("updated_at = NOW()")
            args.append(int(quote_id))
            if fields:
                cur.execute(f"UPDATE quotes SET {', '.join(fields)} WHERE id=%s", args)

            # История изменений
            if new_status and new_status != old_status:
                cur.execute("""
                    INSERT INTO quote_history (quote_id, status, comment, changed_by)
                    VALUES (%s, %s, %s, %s)
                """, (int(quote_id), new_status,
                      body.get('comment', f'Статус изменён: {old_status} → {new_status}'),
                      body.get('changed_by', 'manager')))

            conn.commit()
            return resp({'ok': True})

    finally:
        conn.close()

    return resp({'error': 'Method not allowed'}, 405)
