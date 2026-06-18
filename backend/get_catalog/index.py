"""
API каталога товаров. Возвращает товары с фильтрами по категории, серии,
напряжению, поставщику. Используется витриной и калькулятором.
"""
import json
import os
import psycopg2

SCHEMA = 't_p99554134_pro_trek_system_buil'


def handler(event: dict, context) -> dict:
    """
    GET /get_catalog?category=track&voltage=48&supplier_code=arlight&series_id=1&search=MAG
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }, 'body': ''}

    p = event.get('queryStringParameters') or {}
    category = p.get('category')
    voltage = p.get('voltage')
    supplier_code = p.get('supplier_code')
    series_id = p.get('series_id')
    search = p.get('search', '').strip()
    limit = min(int(p.get('limit') or 200), 500)
    offset = int(p.get('offset') or 0)
    page = p.get('page', 'catalog')

    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path=t_p99554134_pro_trek_system_buil")
    cur = conn.cursor()

    # Список поставщиков
    cur.execute("SELECT id, name, code, website FROM suppliers ORDER BY id")
    suppliers = [{'id': r[0], 'name': r[1], 'code': r[2], 'website': r[3]} for r in cur.fetchall()]

    # Список серий
    cur.execute("""
        SELECT s.id, s.name, s.voltage, s.supplier_id, sup.name as supplier_name
        FROM series s JOIN suppliers sup ON sup.id = s.supplier_id
        ORDER BY s.name
    """)
    all_series = [{'id': r[0], 'name': r[1], 'voltage': r[2], 'supplier_id': r[3], 'supplier_name': r[4]}
                  for r in cur.fetchall()]

    # Товары
    where = ["1=1"]
    args = []

    if category:
        cats = [c.strip() for c in category.split(',')]
        where.append(f"p.category = ANY(%s)")
        args.append(cats)

    if voltage:
        where.append("p.voltage = %s")
        args.append(int(voltage))

    if supplier_code:
        where.append("sup.code = %s")
        args.append(supplier_code)

    if series_id:
        where.append("p.series_id = %s")
        args.append(int(series_id))

    if search:
        where.append("(p.name ILIKE %s OR p.article ILIKE %s)")
        args += [f'%{search}%', f'%{search}%']

    where_str = ' AND '.join(where)

    cur.execute(f"""
        SELECT COUNT(*) FROM products p
        LEFT JOIN suppliers sup ON sup.id = p.supplier_id
        WHERE {where_str}
    """, args)
    total = cur.fetchone()[0]

    cur.execute(f"""
        SELECT
            p.id, p.article, p.name, p.description, p.category,
            p.voltage, p.brand, p.unit, p.image_id, p.has_ies,
            p.raw_params, p.series_id, p.obsolete,
            sup.name as supplier_name, sup.code as supplier_code,
            ps.price_retail, ps.stock_qty, ps.stock_status,
            s.name as series_name
        FROM products p
        LEFT JOIN suppliers sup ON sup.id = p.supplier_id
        LEFT JOIN price_stock ps ON ps.product_id = p.id
        LEFT JOIN series s ON s.id = p.series_id
        WHERE {where_str}
        ORDER BY p.category, p.name
        LIMIT %s OFFSET %s
    """, args + [limit, offset])

    rows = cur.fetchall()
    products = []
    for r in rows:
        raw_params = r[10]
        if isinstance(raw_params, str):
            try:
                raw_params = json.loads(raw_params)
            except Exception:
                raw_params = {}

        image_url = None
        if r[8]:
            image_url = f"https://assets.transistor.ru/files/v3/sites/file.file?id={r[8]}"

        products.append({
            'id': r[0],
            'article': r[1],
            'name': r[2],
            'description': (r[3] or '')[:300],
            'category': r[4],
            'voltage': r[5],
            'brand': r[6],
            'unit': r[7],
            'image_url': image_url,
            'has_ies': r[9],
            'params': raw_params,
            'series_id': r[11],
            'obsolete': r[12],
            'supplier_name': r[13],
            'supplier_code': r[14],
            'price': float(r[15]) if r[15] else None,
            'stock_qty': float(r[16]) if r[16] else 0,
            'stock_status': r[17],
            'series_name': r[18],
        })

    # Статистика по категориям
    cur.execute(f"""
        SELECT p.category, COUNT(*) FROM products p
        LEFT JOIN suppliers sup ON sup.id = p.supplier_id
        WHERE {where_str}
        GROUP BY p.category ORDER BY COUNT(*) DESC
    """, args)
    stats = {r[0]: r[1] for r in cur.fetchall()}

    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'products': products,
            'total': total,
            'limit': limit,
            'offset': offset,
            'suppliers': suppliers,
            'series': all_series,
            'stats': stats,
        }, ensure_ascii=False)
    }