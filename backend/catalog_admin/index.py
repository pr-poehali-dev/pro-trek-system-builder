"""Админ API каталога: иерархия поставщик→серия→категория→товары, ручное добавление, загрузка JSON"""
import json
import os
import psycopg2
from decimal import Decimal

class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Decimal):
            return float(o)
        return super().default(o)

SCHEMA = 't_p99554134_pro_trek_system_buil'
HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
}

CATEGORY_LABELS = {
    'track': 'Шинопровод',
    'head': 'Светильники',
    'connector_straight': 'Соединители прямые',
    'connector_angle': 'Соединители угловые',
    'connector_flexible': 'Соединители гибкие',
    'end_cap': 'Заглушки',
    'mount': 'Крепёж / подвесы',
    'power_inlet': 'Токовводы',
    'driver': 'Блоки питания',
    'controller': 'Контроллеры',
    'base': 'Базы / адаптеры',
    'accessory': 'Аксессуары',
}
CAT_ORDER = list(CATEGORY_LABELS.keys())

def get_db():
    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path={SCHEMA}")
    conn.autocommit = True
    return conn

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    # ── GET / — полная иерархия ───────────────────────────────────────────────
    if method == 'GET' and not action:
        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT id, code, name FROM suppliers ORDER BY id")
        suppliers_rows = cur.fetchall()

        cur.execute("""
            SELECT sr.id, sr.supplier_id, sr.name, sr.voltage, COUNT(p.id) as cnt
            FROM series sr
            LEFT JOIN products p ON p.series_id = sr.id
            WHERE LENGTH(sr.name) < 50
            GROUP BY sr.id, sr.supplier_id, sr.name, sr.voltage
            ORDER BY sr.supplier_id, sr.voltage DESC NULLS LAST
        """)
        series_rows = cur.fetchall()

        cur.execute("""
            SELECT p.id, p.supplier_id, p.series_id, p.article, p.name,
                   p.category, p.voltage, p.unit, p.obsolete, ps.price_retail, ps.stock_qty
            FROM products p
            LEFT JOIN price_stock ps ON ps.product_id = p.id
            WHERE p.series_id IN (SELECT id FROM series WHERE LENGTH(name) < 50)
            ORDER BY p.series_id, p.category, p.article
        """)
        product_rows = cur.fetchall()
        conn.close()

        result = []
        for sup_id, sup_code, sup_name in suppliers_rows:
            series_list = []
            for sr_id, sr_sup_id, sr_name, sr_voltage, sr_cnt in series_rows:
                if sr_sup_id != sup_id:
                    continue
                cats: dict = {}
                for (p_id, p_sup_id, p_sr_id, p_art, p_name,
                     p_cat, p_volt, p_unit, p_obs, p_price, p_stock) in product_rows:
                    if p_sr_id != sr_id:
                        continue
                    if p_cat not in cats:
                        cats[p_cat] = []
                    cats[p_cat].append({
                        'id': p_id,
                        'article': p_art,
                        'name': p_name,
                        'category': p_cat,
                        'voltage': p_volt,
                        'unit': p_unit or 'шт',
                        'obsolete': bool(p_obs),
                        'price': float(p_price) if p_price is not None else None,
                        'stock_qty': float(p_stock) if p_stock is not None else None,
                    })
                categories = [
                    {'key': cat, 'label': CATEGORY_LABELS.get(cat, cat), 'products': prods}
                    for cat, prods in sorted(
                        cats.items(),
                        key=lambda x: CAT_ORDER.index(x[0]) if x[0] in CAT_ORDER else 99
                    )
                ]
                series_list.append({
                    'id': sr_id,
                    'name': sr_name,
                    'voltage': sr_voltage,
                    'product_count': int(sr_cnt),
                    'categories': categories,
                })
            result.append({'id': sup_id, 'code': sup_code, 'name': sup_name, 'series': series_list})

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps(result, ensure_ascii=False, cls=DecimalEncoder)}

    # ── POST add_product ──────────────────────────────────────────────────────
    if method == 'POST' and action == 'add_product':
        body = json.loads(event.get('body') or '{}')
        series_id = body.get('series_id')
        article   = body.get('article', '').strip()
        name      = body.get('name', '').strip()
        category  = body.get('category', 'accessory')
        voltage   = body.get('voltage')
        unit      = body.get('unit', 'шт')
        price     = body.get('price')

        if not series_id or not article or not name:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'series_id, article, name required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT supplier_id FROM series WHERE id = %s", (series_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'series not found'})}
        supplier_id = row[0]

        cur.execute(
            "INSERT INTO products (supplier_id, series_id, article, name, category, voltage, unit)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING RETURNING id",
            (supplier_id, series_id, article, name, category, voltage, unit)
        )
        row = cur.fetchone()
        if row and price is not None:
            cur.execute(
                "INSERT INTO price_stock (product_id, price_retail) VALUES (%s, %s)"
                " ON CONFLICT (product_id) DO UPDATE SET price_retail = EXCLUDED.price_retail",
                (row[0], price)
            )
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    # ── POST update_price ─────────────────────────────────────────────────────
    if method == 'POST' and action == 'update_price':
        body = json.loads(event.get('body') or '{}')
        product_id = body.get('product_id')
        price      = body.get('price')
        if not product_id or price is None:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'product_id, price required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO price_stock (product_id, price_retail) VALUES (%s, %s)"
            " ON CONFLICT (product_id) DO UPDATE SET price_retail = EXCLUDED.price_retail",
            (product_id, price)
        )
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    # ── POST delete_product ───────────────────────────────────────────────────
    if method == 'POST' and action == 'delete_product':
        body = json.loads(event.get('body') or '{}')
        product_id = body.get('product_id')
        if not product_id:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'product_id required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("DELETE FROM price_stock WHERE product_id = %s", (product_id,))
        cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

    # ── POST upload_json ──────────────────────────────────────────────────────
    if method == 'POST' and action == 'upload_json':
        body = json.loads(event.get('body') or '{}')
        supplier_code = body.get('supplier_code', '')
        items = body.get('items', [])

        if not supplier_code or not items:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'supplier_code and items required'})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM suppliers WHERE code = %s", (supplier_code,))
        sup_row = cur.fetchone()
        if not sup_row:
            conn.close()
            return {'statusCode': 404, 'headers': HEADERS, 'body': json.dumps({'error': 'supplier not found'})}
        supplier_id = sup_row[0]

        saved = 0
        series_cache: dict = {}
        for item in items:
            series_name = item.get('series_name', 'Без серии')
            if series_name not in series_cache:
                cur.execute("SELECT id FROM series WHERE supplier_id = %s AND name = %s", (supplier_id, series_name))
                sr = cur.fetchone()
                if not sr:
                    cur.execute(
                        "INSERT INTO series (supplier_id, name, voltage) VALUES (%s, %s, %s) RETURNING id",
                        (supplier_id, series_name, item.get('voltage'))
                    )
                    sr = cur.fetchone()
                series_cache[series_name] = sr[0]
            series_id = series_cache[series_name]

            cur.execute(
                "INSERT INTO products (supplier_id, series_id, article, name, category, voltage, unit)"
                " VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING RETURNING id",
                (supplier_id, series_id,
                 item.get('article', ''), item.get('name', ''),
                 item.get('category', 'accessory'), item.get('voltage'), item.get('unit', 'шт'))
            )
            row = cur.fetchone()
            if row:
                saved += 1
                if item.get('price') is not None:
                    cur.execute(
                        "INSERT INTO price_stock (product_id, price_retail) VALUES (%s, %s)"
                        " ON CONFLICT (product_id) DO UPDATE SET price_retail = EXCLUDED.price_retail",
                        (row[0], item['price'])
                    )

        conn.close()
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True, 'saved': saved})}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'not found'})}