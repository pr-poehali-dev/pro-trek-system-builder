"""
API для сохранения и загрузки проектов пользователя.
"""
import json
import os
import psycopg2

SCHEMA = 't_p99554134_pro_trek_system_buil'

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    """
    GET  /projects_api?session_id=xxx          — загрузить проект сессии
    POST /projects_api  body: {project}        — создать/обновить проект
    PUT  /projects_api  body: {id, ...fields}  — обновить шаг/состояние
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path=t_p99554134_pro_trek_system_buil")
    cur = conn.cursor()

    if method == 'GET':
        p = event.get('queryStringParameters') or {}
        session_id = p.get('session_id', '')
        project_id = p.get('project_id')

        if project_id:
            cur.execute("""
                SELECT id, session_id, name, step, track_type, mount_type,
                       voltage, color, selected_supplier_id, selected_series_id, state
                FROM projects WHERE id = %s
            """, (int(project_id),))
        elif session_id:
            cur.execute("""
                SELECT id, session_id, name, step, track_type, mount_type,
                       voltage, color, selected_supplier_id, selected_series_id, state
                FROM projects WHERE session_id = %s
                ORDER BY updated_at DESC LIMIT 1
            """, (session_id,))
        else:
            conn.close()
            return {'statusCode': 400, 'headers': CORS,
                    'body': json.dumps({'error': 'session_id required'})}

        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
                    'body': json.dumps({'project': None})}

        proj_id = row[0]
        # Конструкции
        cur.execute("""
            SELECT id, sort_order, shape, dimensions, total_length, corners_count, is_closed
            FROM project_constructions WHERE project_id = %s ORDER BY sort_order
        """, (proj_id,))
        constructions = []
        for c in cur.fetchall():
            dims = c[3]
            if isinstance(dims, str):
                try:
                    dims = json.loads(dims)
                except Exception:
                    dims = {}
            constructions.append({
                'id': c[0], 'sort_order': c[1], 'shape': c[2],
                'dims': dims, 'total_length': float(c[4]) if c[4] else 0,
                'corners_count': c[5], 'is_closed': c[6],
            })

        state = row[10]
        if isinstance(state, str):
            try:
                state = json.loads(state)
            except Exception:
                state = {}

        project = {
            'id': row[0], 'session_id': row[1], 'name': row[2],
            'step': row[3], 'track_type': row[4], 'mount_type': row[5],
            'voltage': row[6], 'color': row[7],
            'selected_supplier_id': row[8], 'selected_series_id': row[9],
            'state': state or {}, 'constructions': constructions,
        }
        conn.close()
        return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'project': project}, ensure_ascii=False)}

    elif method == 'POST':
        body = json.loads(event.get('body') or '{}')
        session_id = body.get('session_id', 'anon')
        name = body.get('name', 'Мой проект')
        step = int(body.get('step', 1))
        track_type = body.get('track_type')
        mount_type = body.get('mount_type')
        voltage = body.get('voltage')
        color = body.get('color')
        supplier_id = body.get('selected_supplier_id')
        series_id = body.get('selected_series_id')
        state = json.dumps(body.get('state', {}), ensure_ascii=False)

        cur.execute("""
            INSERT INTO projects (session_id, name, step, track_type, mount_type,
                                  voltage, color, selected_supplier_id, selected_series_id, state)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (session_id, name, step, track_type, mount_type,
              voltage, color, supplier_id, series_id, state))
        proj_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': proj_id}, ensure_ascii=False)}

    elif method == 'PUT':
        body = json.loads(event.get('body') or '{}')
        proj_id = body.get('id')
        if not proj_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS,
                    'body': json.dumps({'error': 'id required'})}

        fields = []
        args = []
        for f in ['step', 'track_type', 'mount_type', 'voltage', 'color',
                  'selected_supplier_id', 'selected_series_id', 'name']:
            if f in body:
                fields.append(f"{f} = %s")
                args.append(body[f])
        if 'state' in body:
            fields.append("state = %s")
            args.append(json.dumps(body['state'], ensure_ascii=False))

        if fields:
            fields.append("updated_at = NOW()")
            args.append(int(proj_id))
            cur.execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = %s", args)

        # Обновить конструкции если переданы
        if 'constructions' in body:
            cur.execute("SELECT id FROM project_constructions WHERE project_id = %s", (int(proj_id),))
            existing_ids = {r[0] for r in cur.fetchall()}
            new_ids = set()
            for i, c in enumerate(body['constructions']):
                cid = c.get('id')
                dims = json.dumps(c.get('dims', {}), ensure_ascii=False)
                shape = c.get('shape', 'straight')
                total_length = float(c.get('total_length', 0))
                corners = int(c.get('corners_count', 0))
                closed = bool(c.get('is_closed', False))

                if cid and int(cid) in existing_ids:
                    cur.execute("""
                        UPDATE project_constructions
                        SET shape=%s, dimensions=%s, total_length=%s,
                            corners_count=%s, is_closed=%s, sort_order=%s
                        WHERE id=%s
                    """, (shape, dims, total_length, corners, closed, i, int(cid)))
                    new_ids.add(int(cid))
                else:
                    cur.execute("""
                        INSERT INTO project_constructions
                        (project_id, sort_order, shape, dimensions, total_length, corners_count, is_closed)
                        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
                    """, (int(proj_id), i, shape, dims, total_length, corners, closed))
                    new_ids.add(cur.fetchone()[0])

            # Помечаем удалённые как пустые (не удаляем из-за ограничений)
            for old_id in existing_ids - new_ids:
                cur.execute("UPDATE project_constructions SET shape='deleted' WHERE id=%s", (old_id,))

        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})}

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': ''}