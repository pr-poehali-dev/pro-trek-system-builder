"""
Парсер каталога поставщика. Принимает код поставщика, скачивает его JSON-файлы,
классифицирует товары по 12 категориям и сохраняет в PostgreSQL.
"""
import json
import logging
import os
import re
import urllib.request
from typing import Optional
import psycopg2

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCHEMA = 't_p99554134_pro_trek_system_buil'

# ─── Классификатор ────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS = {
    'driver': [
        'блок питания', 'источник питания', 'драйвер', 'источник тока',
        'dali-драйвер', 'выпрямитель', 'power supply', 'driver', 'arj-',
        'mean well', 'блок пит'
    ],
    'track': [
        'шинопровод', 'шина', 'трек', 'track', 'busbar', 'mag-track',
        'профиль трек'
    ],
    'head': [
        'mag-flat', 'mag-spot', 'mag-laser', 'mag-ultra', 'mag-orient',
        'светильник mag', 'spot mag', 'luminaire', 'прожектор mag'
    ],
    'connector_flexible': ['гибкий', 'flex', 'гибк', 'l-коннектор'],
    'connector_angle': [
        'угловой', 'угол', 'l90', 'l-образн', 'corner', 'угловой соединитель',
        'mag-con', 'коннектор угл'
    ],
    'connector_straight': [
        'прямой соединитель', 'прямой коннектор', 'стык прям',
        'соединитель прям', 'straight'
    ],
    'end_cap': ['заглушка', 'торцев', 'крышка торц', 'end cap', 'cap'],
    'mount': ['подвес', 'кронштейн', 'держатель', 'suspension', 'bracket', 'крепёж', 'крепление'],
    'power_inlet': ['токоввод', 'ввод питания', 'power inlet', 'провод питания', 'кабель питания'],
    'controller': ['контроллер', 'диммер', 'dali-контроллер', 'пульт', 'smart', 'управлени'],
    'base': ['база', 'base', 'адаптер', 'adapter'],
}

VOLTAGE_RE = re.compile(r'(\d+)\s*[VВвольт](?!\w)', re.IGNORECASE)
POWER_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s*[WВт](?!\w)', re.IGNORECASE)
LENGTH_RE = re.compile(r'(\d+(?:[.,]\d+)?)\s*(?:м\b|m\b|метр)', re.IGNORECASE)
LENGTH_MM_RE = re.compile(r'(\d{3,5})\s*мм', re.IGNORECASE)
CURRENT_RE = re.compile(r'(\d+)\s*mA', re.IGNORECASE)
ANGLE_RE = re.compile(r'(\d+)\s*(?:°|deg|град)', re.IGNORECASE)
CCT_RE = re.compile(r'(\d{3,4})[Kk](?:\s|$|\))', re.IGNORECASE)
BEAM_RE = re.compile(r'(\d+)\s*deg', re.IGNORECASE)
SERIES_RE = re.compile(r'MAG[-\s]?\w+', re.IGNORECASE)


def classify(name: str, desc: str, has_ies: bool, params: dict) -> str:
    text = (name + ' ' + (desc or '')).lower()

    # Специальная логика: если есть MAG-TRACK или длина + упоминание трека
    if 'mag-track' in text or 'шинопровод' in text:
        return 'track'

    # Проверяем по приоритету
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                if cat == 'track':
                    if LENGTH_RE.search(text) or LENGTH_MM_RE.search(text):
                        return 'track'
                elif cat == 'head':
                    if has_ies or (POWER_RE.search(text) and VOLTAGE_RE.search(text)):
                        return 'head'
                else:
                    return cat

    # Светильник по IES + мощность
    if has_ies and POWER_RE.search(text):
        return 'head'

    return 'accessory'


def extract_params(name: str, desc: str, category: str) -> dict:
    text = name + ' ' + (desc or '')
    p = {}

    # Напряжение
    vm = VOLTAGE_RE.findall(text)
    if vm:
        voltages = [int(v) for v in vm if int(v) in (12, 24, 48, 220, 230)]
        if voltages:
            p['voltage'] = voltages[0]

    # Мощность
    wm = POWER_RE.findall(text)
    if wm:
        p['power_w'] = float(wm[0].replace(',', '.'))

    # Длина
    lm = LENGTH_RE.findall(text)
    if lm:
        p['length_m'] = float(lm[0].replace(',', '.'))
    else:
        mm = LENGTH_MM_RE.findall(text)
        if mm:
            p['length_m'] = round(int(mm[0]) / 1000, 3)

    # Ток
    cm = CURRENT_RE.findall(text)
    if cm:
        p['current_ma'] = int(cm[0])

    # Угол
    am = ANGLE_RE.findall(text)
    if am:
        angles = [int(a) for a in am]
        p['angle_deg'] = angles[0]

    # Цветовая температура
    cct = CCT_RE.findall(text)
    if cct:
        p['cct_k'] = int(cct[0])

    # Угол рассеивания
    beam = BEAM_RE.findall(text)
    if beam:
        p['beam_angle'] = int(beam[0])

    # Диммируемость
    if 'dali' in text.lower():
        p['dimmable'] = True
        p['control_protocol'] = 'DALI'
    elif 'dimm' in text.lower() or 'диммир' in text.lower():
        p['dimmable'] = True

    # Серия MAG
    sm = SERIES_RE.findall(name)
    if sm:
        p['series_name'] = sm[0].upper()

    # Цвет
    name_lower = name.lower()
    if '(bk)' in name_lower or 'черн' in name_lower or 'black' in name_lower:
        p['color'] = 'black'
    elif '(wh)' in name_lower or 'бел' in name_lower or 'white' in name_lower:
        p['color'] = 'white'

    # Тип монтажа трека
    if category == 'track':
        if 'встраивае' in text.lower() or '-f-' in name.lower() or 'floor' in text.lower():
            p['mount_type'] = 'built_in'
        elif 'подвес' in text.lower() or 'hang' in text.lower():
            p['mount_type'] = 'hang'
        else:
            p['mount_type'] = 'surface'

    return p


# ─── Стриминговый парсер JSON ─────────────────────────────────────────────────

def stream_products(url: str, limit: int = 0):
    req = urllib.request.Request(url, headers={'User-Agent': 'PRO-TREK/1.0'})
    buffer = ''
    depth = 0
    obj_start = None
    in_str = False
    esc = False
    count = 0
    inside_array = False

    with urllib.request.urlopen(req, timeout=25) as resp:
        while True:
            chunk = resp.read(65536).decode('utf-8', errors='ignore')
            if not chunk:
                break
            buffer += chunk

            if not inside_array:
                marker = '"products":['
                idx = buffer.find(marker)
                if idx == -1:
                    if len(buffer) > 200:
                        buffer = buffer[-200:]
                    continue
                buffer = buffer[idx + len(marker):]
                inside_array = True

            i = 0
            while i < len(buffer):
                c = buffer[i]
                if in_str:
                    if esc:
                        esc = False
                    elif c == '\\':
                        esc = True
                    elif c == '"':
                        in_str = False
                else:
                    if c == '"':
                        in_str = True
                    elif c == '{':
                        if depth == 0:
                            obj_start = i
                        depth += 1
                    elif c == '}':
                        depth -= 1
                        if depth == 0 and obj_start is not None:
                            try:
                                obj = json.loads(buffer[obj_start:i + 1])
                                yield obj
                                count += 1
                                if limit and count >= limit:
                                    return
                            except Exception:
                                pass
                            obj_start = None
                i += 1

            if obj_start is not None:
                buffer = buffer[obj_start:]
                obj_start = 0
            else:
                buffer = buffer[-10:]


def get_image_id(files: list) -> Optional[str]:
    if not files:
        return None
    for f in files:
        if isinstance(f, dict) and f.get('type') == 'photo':
            return f.get('id')
    return None


def has_ies_file(files: list) -> bool:
    if not files:
        return False
    return any(
        isinstance(f, dict) and (
            f.get('type', '').lower() in ('ies', 'file-ies') or
            (f.get('name', '') or '').lower().endswith('.ies')
        )
        for f in files
    )


# ─── Основной обработчик ──────────────────────────────────────────────────────

def handler(event: dict, context) -> dict:
    """
    Парсит каталог поставщика и сохраняет товары в БД.
    POST /parse_catalog  body: {"supplier_code": "arlight", "limit": 0}
    GET  /parse_catalog?supplier_code=arlight&limit=100
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
    else:
        body = event.get('queryStringParameters') or {}

    supplier_code = body.get('supplier_code', 'arlight')
    limit = int(body.get('limit') or 0)

    conn = psycopg2.connect(os.environ['DATABASE_URL'], options=f"-c search_path=t_p99554134_pro_trek_system_buil")
    cur = conn.cursor()

    cur.execute("SELECT id, config FROM suppliers WHERE code = %s", (supplier_code,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Supplier {supplier_code} not found'})}

    supplier_id, config = row[0], row[1]
    if isinstance(config, str):
        config = json.loads(config)

    products_url = config['files']['products']
    image_base = config.get('image_base_url', '')

    saved = 0
    skipped = 0
    errors = 0
    categories_stat = {}

    for raw in stream_products(products_url, limit=limit):
        try:
            article = str(raw.get('article', '')).strip()
            name = (raw.get('name') or '').strip()
            if not article or not name:
                skipped += 1
                continue

            obsolete = int(raw.get('obsolete') or 0)
            texts = raw.get('texts') or {}
            desc = (texts.get('descript') or '')[:1000]
            files = raw.get('files') or []
            has_ies = has_ies_file(files)
            image_id = get_image_id(files)
            brand_id = raw.get('brand')
            serie_ext = raw.get('serie')
            unit_id = raw.get('unit', 796)
            unit = 'шт' if unit_id == 796 else ('м' if unit_id in (6, 18) else 'шт')

            params = extract_params(name, desc, 'unknown')
            category = classify(name, desc, has_ies, params)
            params = extract_params(name, desc, category)

            categories_stat[category] = categories_stat.get(category, 0) + 1

            voltage = params.get('voltage')
            brand_name = 'Arlight' if brand_id == 4 else (str(brand_id) if brand_id else None)

            # Серия
            series_id = None
            if serie_ext:
                cur.execute(
                    "INSERT INTO series (supplier_id, external_id, name) VALUES (%s,%s,%s) "
                    "ON CONFLICT (supplier_id, external_id) DO UPDATE SET name=EXCLUDED.name "
                    "RETURNING id",
                    (supplier_id, str(serie_ext)[:255], str(serie_ext)[:200])
                )
                r = cur.fetchone()
                series_id = r[0] if r else None

            # Товар
            cur.execute(
                f"""INSERT INTO products
                    (supplier_id, article, name, description, category, series_id,
                     brand, voltage, unit, obsolete, image_id, has_ies, raw_params)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (supplier_id, article)
                    DO UPDATE SET
                        name=EXCLUDED.name, description=EXCLUDED.description,
                        category=EXCLUDED.category, series_id=EXCLUDED.series_id,
                        brand=EXCLUDED.brand, voltage=EXCLUDED.voltage,
                        image_id=EXCLUDED.image_id, has_ies=EXCLUDED.has_ies,
                        raw_params=EXCLUDED.raw_params, updated_at=NOW()
                    RETURNING id""",
                (supplier_id, article, name[:500], desc, category, series_id,
                 brand_name, voltage, unit, obsolete,
                 image_id, has_ies, json.dumps(params, ensure_ascii=False))
            )
            prod_row = cur.fetchone()
            if not prod_row:
                skipped += 1
                continue
            prod_id = prod_row[0]

            # Параметры
            cur.execute("SELECT id FROM product_params WHERE product_id=%s LIMIT 1", (prod_id,))
            if not cur.fetchone():
                for k, v in params.items():
                    unit_p = None
                    num = None
                    if isinstance(v, (int, float)):
                        num = v
                    try:
                        cur.execute(
                            "INSERT INTO product_params (product_id,param_name,param_value,param_number) "
                            "VALUES (%s,%s,%s,%s)",
                            (prod_id, k, str(v), num)
                        )
                    except Exception:
                        pass

            # Демо цена
            cur.execute("SELECT id FROM price_stock WHERE product_id=%s", (prod_id,))
            if not cur.fetchone():
                import random
                demo_price = round(random.uniform(150, 8000), 2)
                demo_stock = random.randint(0, 200)
                cur.execute(
                    "INSERT INTO price_stock (product_id, price_retail, stock_qty, stock_status) "
                    "VALUES (%s,%s,%s,%s)",
                    (prod_id, demo_price, demo_stock, 'demo')
                )

            saved += 1
            if saved % 100 == 0:
                conn.commit()
                logger.info(f"Saved {saved} products...")

        except Exception as e:
            errors += 1
            logger.error(f"Error on article {raw.get('article')}: {e}")
            conn.rollback()

    conn.commit()
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'saved': saved,
            'skipped': skipped,
            'errors': errors,
            'categories': categories_stat,
        }, ensure_ascii=False)
    }