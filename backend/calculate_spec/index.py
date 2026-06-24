"""
Калькулятор спецификации трековой системы.
Принимает конструкции (формы + размеры), возвращает полный список комплектующих.
"""
import json
import math
import os
import psycopg2

SCHEMA = 't_p99554134_pro_trek_system_buil'

SHAPE_CONFIG = {
    'straight':  {'segments': 1, 'corners': 0, 'closed': False},
    'l_shaped':  {'segments': 2, 'corners': 1, 'closed': False},
    's_shaped':  {'segments': 3, 'corners': 2, 'closed': False},
    'u_shaped':  {'segments': 3, 'corners': 2, 'closed': False},
    'closed':    {'segments': 4, 'corners': 4, 'closed': True},
    'custom':    {'segments': 0, 'corners': 0, 'closed': False},
}


def get_segments(shape: str, dims: dict) -> list:
    """Возвращает длины отрезков для данной формы."""
    L = float(dims.get('length', 0))
    W = float(dims.get('width', L))
    L2 = float(dims.get('length2', L))

    if shape == 'straight':
        return [L]
    elif shape == 'l_shaped':
        return [L, W]
    elif shape == 's_shaped':
        return [L, W, L2]
    elif shape == 'u_shaped':
        return [L, W, L]
    elif shape == 'closed':
        return [L, W, L, W]
    elif shape == 'custom':
        segs = dims.get('segments', [])
        return [float(s) for s in segs if s]
    return [L]


def get_corners(shape: str, dims: dict) -> int:
    if shape == 'custom':
        return int(dims.get('corners', 0))
    return SHAPE_CONFIG.get(shape, {}).get('corners', 0)


def is_closed(shape: str) -> bool:
    return SHAPE_CONFIG.get(shape, {}).get('closed', False)


def fit_tracks(segment_length: float, available_lengths: list) -> list:
    """
    Жадный алгоритм подбора треков для одного отрезка.
    Минимизирует количество стыков.
    available_lengths — список доступных длин треков (float), отсортированный по убыванию.
    """
    if not available_lengths:
        return []
    result = []
    remaining = segment_length
    sorted_lengths = sorted(available_lengths, reverse=True)

    while remaining > 0.01:
        # Ищем наибольший трек <= remaining
        candidates = [l for l in sorted_lengths if l <= remaining + 0.001]
        if candidates:
            best = candidates[0]
        else:
            best = sorted_lengths[-1]  # минимальный доступный

        result.append(best)
        remaining -= best
        remaining = round(remaining, 3)

    return result


def handler(event: dict, context) -> dict:
    """
    POST /calculate_spec
    body: {
      "constructions": [
        {"shape": "l_shaped", "dims": {"length": 3, "width": 2}},
        {"shape": "straight",  "dims": {"length": 4}}
      ],
      "supplier_code": "arlight",
      "voltage": 48,
      "mount_type": "surface"
    }
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    constructions = body.get('constructions', [])
    supplier_code = body.get('supplier_code', 'arlight')
    voltage = body.get('voltage')
    mount_type = body.get('mount_type', 'surface')

    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path=t_p99554134_pro_trek_system_buil")
    cur = conn.cursor()

    # Загружаем доступные треки
    track_query = """
        SELECT p.id, p.article, p.name, p.raw_params,
               ps.price_retail, ps.stock_qty, s.name as series_name
        FROM products p
        LEFT JOIN suppliers sup ON sup.id = p.supplier_id
        LEFT JOIN price_stock ps ON ps.product_id = p.id
        LEFT JOIN series s ON s.id = p.series_id
        WHERE p.category = 'track'
        AND sup.code = %s
    """
    track_args = [supplier_code]
    if voltage:
        track_query += " AND (p.voltage = %s OR p.voltage IS NULL)"
        track_args.append(voltage)

    cur.execute(track_query, track_args)
    db_tracks = []
    for r in cur.fetchall():
        params = r[3]
        if isinstance(params, str):
            try:
                params = json.loads(params)
            except Exception:
                params = {}
        length = params.get('length_m')
        if length and float(length) > 0:
            db_tracks.append({
                'id': r[0], 'article': r[1], 'name': r[2],
                'length_m': float(length),
                'price': float(r[4]) if r[4] else None,
                'stock': float(r[5]) if r[5] else 0,
                'series': r[6],
                'mount_type': params.get('mount_type', 'surface'),
            })

    available_lengths = sorted(set(t['length_m'] for t in db_tracks), reverse=True)
    if not available_lengths:
        available_lengths = [3.0, 2.0, 1.5, 1.0, 0.5]

    def find_track(length_m):
        for t in db_tracks:
            if abs(t['length_m'] - length_m) < 0.05:
                return t
        return None

    # Загружаем соединители
    def load_cat(cat):
        cur.execute("""
            SELECT p.id, p.article, p.name, p.raw_params, ps.price_retail, ps.stock_qty
            FROM products p
            LEFT JOIN suppliers sup ON sup.id = p.supplier_id
            LEFT JOIN price_stock ps ON ps.product_id = p.id
            WHERE p.category = %s AND sup.code = %s
            ORDER BY ps.price_retail NULLS LAST LIMIT 20
        """, (cat, supplier_code))
        rows = []
        for r in cur.fetchall():
            params = r[3]
            if isinstance(params, str):
                try:
                    params = json.loads(params)
                except Exception:
                    params = {}
            rows.append({
                'id': r[0], 'article': r[1], 'name': r[2],
                'params': params,
                'price': float(r[4]) if r[4] else None,
                'stock': float(r[5]) if r[5] else 0,
            })
        return rows

    conn_angle = load_cat('connector_angle')
    conn_straight = load_cat('connector_straight')
    conn_flex = load_cat('connector_flexible')
    end_caps = load_cat('end_cap')
    mounts = load_cat('mount')
    power_inlets = load_cat('power_inlet')

    # ─── Расчёт ───────────────────────────────────────────────────────────────
    total_track_lengths = []
    total_straight_joints = 0
    total_corners = 0
    total_constructions = len(constructions)
    closed_count = 0
    open_count = 0

    spec_tracks = {}  # article -> {name, qty, price, note}

    for const in constructions:
        shape = const.get('shape', 'straight')
        dims = const.get('dims', {})

        segments = get_segments(shape, dims)
        corners = get_corners(shape, dims)
        closed = is_closed(shape)

        if closed:
            closed_count += 1
        else:
            open_count += 1

        total_corners += corners

        for seg_len in segments:
            if seg_len <= 0:
                continue
            chosen = fit_tracks(seg_len, available_lengths)
            straight_joints = len(chosen) - 1
            total_straight_joints += straight_joints

            for length in chosen:
                total_track_lengths.append(length)
                track = find_track(length)
                if track:
                    art = track['article']
                    if art not in spec_tracks:
                        spec_tracks[art] = {
                            'article': art,
                            'name': track['name'],
                            'category': 'track',
                            'qty': 0,
                            'unit': 'шт',
                            'price': track['price'],
                            'length_m': length,
                        }
                    spec_tracks[art]['qty'] += 1
                else:
                    key = f'track_{length}m'
                    if key not in spec_tracks:
                        spec_tracks[key] = {
                            'article': key,
                            'name': f'Шинопровод {length}м',
                            'category': 'track',
                            'qty': 0,
                            'unit': 'шт',
                            'price': None,
                        }
                    spec_tracks[key]['qty'] += 1

    total_track_count = len(total_track_lengths)
    total_length_m = round(sum(total_track_lengths), 2)

    # Подвесы: ceil(длина / 1.2) + углы, не меньше кол-ва треков
    mounts_qty = max(
        math.ceil(total_length_m / 1.2) + total_corners,
        total_track_count
    )

    # Заглушки: 2 на каждую незамкнутую конструкцию
    end_caps_qty = open_count * 2

    # Токовводы: max(1, ceil(длина / 20)) на конструкцию
    power_inlets_qty = sum(
        max(1, math.ceil(sum(get_segments(c.get('shape', 'straight'), c.get('dims', {}))) / 20))
        for c in constructions
    )

    # ─── Формируем спецификацию ───────────────────────────────────────────────
    spec = []
    sort = 0

    # Треки
    for item in sorted(spec_tracks.values(), key=lambda x: -x.get('length_m', 0)):
        spec.append({**item, 'sort': sort})
        sort += 1

    # Прямые соединители
    if total_straight_joints > 0:
        cs = conn_straight[0] if conn_straight else None
        spec.append({
            'article': cs['article'] if cs else 'connector_straight',
            'name': cs['name'] if cs else 'Прямой соединитель',
            'category': 'connector_straight',
            'qty': total_straight_joints,
            'unit': 'шт',
            'price': cs['price'] if cs else None,
            'sort': sort,
        })
        sort += 1

    # Угловые соединители — с выбором варианта
    if total_corners > 0:
        ca = conn_angle[0] if conn_angle else None
        cf = conn_flex[0] if conn_flex else None
        has_angle_connector = ca is not None
        has_flex_connector = cf is not None

        spec.append({
            'article': ca['article'] if ca else ('connector_angle_45' if not has_flex_connector else None),
            'name': ca['name'] if ca else 'Угловой соединитель / зарезка 45°',
            'category': 'connector_angle',
            'qty': total_corners,
            'unit': 'шт',
            'price': ca['price'] if ca else None,
            'sort': sort,
            'angle_options': {
                'has_connector': has_angle_connector,
                'has_flex': has_flex_connector,
                'connector': {'article': ca['article'], 'name': ca['name'], 'price': ca['price']} if ca else None,
                'flex': {'article': cf['article'], 'name': cf['name'], 'price': cf['price']} if cf else None,
                'cut_45': {'name': 'Зарезка под 45°', 'note': 'Монтаж стык в стык без соединителя', 'price': 0},
            },
            'selected_option': 'connector' if has_angle_connector else ('flex' if has_flex_connector else 'cut_45'),
            'note': None if (has_angle_connector or has_flex_connector) else 'Зарезка торцовкой под 45°',
        })
        sort += 1

    # Заглушки
    if end_caps_qty > 0:
        ec = end_caps[0] if end_caps else None
        spec.append({
            'article': ec['article'] if ec else 'end_cap',
            'name': ec['name'] if ec else 'Заглушка торцевая',
            'category': 'end_cap',
            'qty': end_caps_qty,
            'unit': 'шт',
            'price': ec['price'] if ec else None,
            'sort': sort,
        })
        sort += 1

    # Подвесы
    if mounts_qty > 0:
        mt = mounts[0] if mounts else None
        spec.append({
            'article': mt['article'] if mt else 'mount',
            'name': mt['name'] if mt else 'Подвес / крепление',
            'category': 'mount',
            'qty': mounts_qty,
            'unit': 'шт',
            'price': mt['price'] if mt else None,
            'sort': sort,
            'note': f'ceil({total_length_m}м / 1.2) + {total_corners} углов = {mounts_qty} шт',
        })
        sort += 1

    # Токовводы
    pi = power_inlets[0] if power_inlets else None
    spec.append({
        'article': pi['article'] if pi else 'power_inlet',
        'name': pi['name'] if pi else 'Токоввод (кабель питания)',
        'category': 'power_inlet',
        'qty': power_inlets_qty,
        'unit': 'шт',
        'price': pi['price'] if pi else None,
        'sort': sort,
    })

    # Картинки категорий из card_images
    cur.execute("SELECT id, url FROM card_images WHERE key = 'category'")
    cat_images = {row[0]: row[1] for row in cur.fetchall()}

    # Прикрепляем image_url к каждому элементу спецификации
    for item in spec:
        cat = item.get('category', '')
        if cat in cat_images:
            item['image_url'] = cat_images[cat]

    # Итоги
    total_price = sum(
        (item.get('price') or 0) * item['qty']
        for item in spec
        if item.get('price')
    )

    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'spec': spec,
            'summary': {
                'total_length_m': total_length_m,
                'total_track_count': total_track_count,
                'total_corners': total_corners,
                'straight_joints': total_straight_joints,
                'constructions_count': total_constructions,
                'end_caps_qty': end_caps_qty,
                'mounts_qty': mounts_qty,
                'power_inlets_qty': power_inlets_qty,
                'total_price': round(total_price, 2),
            },
            'available_track_lengths': available_lengths,
        }, ensure_ascii=False)
    }