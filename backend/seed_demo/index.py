"""
Заполняет БД демо-данными для тестирования мульти-поставщик логики.
Создаёт полный набор товаров для Arlight (MAG-45 система, 48V) и EGO Lighting (Track-PRO, 48V+220V).
"""
import json
import os
import psycopg2

SCHEMA = 't_p99554134_pro_trek_system_buil'


def upsert_product(cur, supplier_id, article, name, description, category,
                   series_id, voltage, params, price, stock):
    cur.execute("""
        INSERT INTO products
            (supplier_id, article, name, description, category, series_id,
             voltage, unit, raw_params)
        VALUES (%s,%s,%s,%s,%s,%s,%s,'шт',%s)
        ON CONFLICT (supplier_id, article)
        DO UPDATE SET
            name=EXCLUDED.name, description=EXCLUDED.description,
            category=EXCLUDED.category, series_id=EXCLUDED.series_id,
            voltage=EXCLUDED.voltage, raw_params=EXCLUDED.raw_params,
            updated_at=NOW()
        RETURNING id
    """, (supplier_id, article, name, description, category, series_id,
          voltage, json.dumps(params, ensure_ascii=False)))
    prod_id = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO price_stock (product_id, price_retail, stock_qty, stock_status)
        VALUES (%s,%s,%s,'in_stock')
        ON CONFLICT (product_id)
        DO UPDATE SET price_retail=EXCLUDED.price_retail,
                      stock_qty=EXCLUDED.stock_qty, updated_at=NOW()
    """, (prod_id, price, stock))
    return prod_id


def upsert_series(cur, supplier_id, ext_id, name, voltage=None):
    cur.execute("""
        INSERT INTO series (supplier_id, external_id, name, voltage)
        VALUES (%s,%s,%s,%s)
        ON CONFLICT (supplier_id, external_id)
        DO UPDATE SET name=EXCLUDED.name, voltage=EXCLUDED.voltage
        RETURNING id
    """, (supplier_id, ext_id, name, voltage))
    return cur.fetchone()[0]


def handler(event: dict, context) -> dict:
    """
    GET/POST /seed_demo — заполняет обоих поставщиков демо-товарами.
    Idempotent: можно вызывать повторно, данные обновятся.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': ''}

    conn = psycopg2.connect(
        os.environ['DATABASE_URL'],
        options=f"-c search_path={SCHEMA}"
    )
    cur = conn.cursor()
    results = {}

    # ─── ARLIGHT ─────────────────────────────────────────────────────────────
    cur.execute("SELECT id FROM suppliers WHERE code='arlight'")
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 404, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'arlight supplier not found'})}
    arl_id = row[0]

    # Серии Arlight
    mag45_id  = upsert_series(cur, arl_id, 'MAG-45',   'MAG-45 (48V)',    48)
    mag20_id  = upsert_series(cur, arl_id, 'MAG-20',   'MAG-20 (24V)',    24)
    tr4_id    = upsert_series(cur, arl_id, 'TRACK-4TR','TRACK-4TR (220V)',220)

    # ── Треки Arlight MAG-45 (48V) ──
    track_data = [
        ('ARL-MAG45-TR05-BK', 'Шинопровод MAG-TRACK-4592-500 (BK)',
         'Магнитный трек 0.5м, 48В, черный, накладной', 'track', mag45_id, 48,
         {'length_m': 0.5, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'black'},
         890, 120),
        ('ARL-MAG45-TR10-BK', 'Шинопровод MAG-TRACK-4592-1000 (BK)',
         'Магнитный трек 1м, 48В, черный, накладной', 'track', mag45_id, 48,
         {'length_m': 1.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'black'},
         1450, 85),
        ('ARL-MAG45-TR15-BK', 'Шинопровод MAG-TRACK-4592-1500 (BK)',
         'Магнитный трек 1.5м, 48В, черный', 'track', mag45_id, 48,
         {'length_m': 1.5, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'black'},
         1980, 60),
        ('ARL-MAG45-TR20-BK', 'Шинопровод MAG-TRACK-4592-2000 (BK)',
         'Магнитный трек 2м, 48В, черный', 'track', mag45_id, 48,
         {'length_m': 2.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'black'},
         2490, 45),
        ('ARL-MAG45-TR30-BK', 'Шинопровод MAG-TRACK-4592-3000 (BK)',
         'Магнитный трек 3м, 48В, черный', 'track', mag45_id, 48,
         {'length_m': 3.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'black'},
         3490, 30),
        ('ARL-MAG45-TR10-WH', 'Шинопровод MAG-TRACK-4592-1000 (WH)',
         'Магнитный трек 1м, 48В, белый', 'track', mag45_id, 48,
         {'length_m': 1.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'white'},
         1450, 40),
        ('ARL-MAG45-TR20-WH', 'Шинопровод MAG-TRACK-4592-2000 (WH)',
         'Магнитный трек 2м, 48В, белый', 'track', mag45_id, 48,
         {'length_m': 2.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'surface', 'color': 'white'},
         2490, 25),
        # Встраиваемые треки MAG-45
        ('ARL-MAG45-F10-BK', 'Трек встраиваемый MAG-TRACK-4560-F-1000 (BK)',
         'Встраиваемый магнитный трек 1м, 48В, черный', 'track', mag45_id, 48,
         {'length_m': 1.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'built_in', 'color': 'black'},
         2190, 30),
        ('ARL-MAG45-F20-BK', 'Трек встраиваемый MAG-TRACK-4560-F-2000 (BK)',
         'Встраиваемый магнитный трек 2м, 48В, черный', 'track', mag45_id, 48,
         {'length_m': 2.0, 'voltage': 48, 'series_name': 'MAG-45', 'mount_type': 'built_in', 'color': 'black'},
         3890, 18),
        # 220V треки (4TR)
        ('ARL-TR4-20-BK', 'Шинопровод TRACK-4TR-2000 (BK)',
         'Трек 4-проводный 2м, 220В, черный', 'track', tr4_id, 220,
         {'length_m': 2.0, 'voltage': 220, 'series_name': 'TRACK-4TR', 'mount_type': 'surface', 'color': 'black'},
         890, 55),
        ('ARL-TR4-10-BK', 'Шинопровод TRACK-4TR-1000 (BK)',
         'Трек 4-проводный 1м, 220В, черный', 'track', tr4_id, 220,
         {'length_m': 1.0, 'voltage': 220, 'series_name': 'TRACK-4TR', 'mount_type': 'surface', 'color': 'black'},
         540, 70),
    ]

    # ── Соединители MAG-45 ──
    connector_data = [
        ('ARL-MAG45-CON-L90-INT-BK', 'Угловой соединитель MAG-CON-4592-L90-INT (BK)',
         'Внутренний угол 90° для MAG-45, черный', 'connector_angle', mag45_id, 48,
         {'angle_deg': 90, 'series_name': 'MAG-45', 'color': 'black', 'connector_type': 'INT'},
         890, 200),
        ('ARL-MAG45-CON-L90-EXT-BK', 'Угловой соединитель MAG-CON-4592-L90-EXT (BK)',
         'Внешний угол 90° для MAG-45, черный', 'connector_angle', mag45_id, 48,
         {'angle_deg': 90, 'series_name': 'MAG-45', 'color': 'black', 'connector_type': 'EXT'},
         890, 150),
        ('ARL-MAG45-CON-STR-BK', 'Прямой соединитель MAG-CON-4592-STR (BK)',
         'Прямой стык для MAG-45, черный', 'connector_straight', mag45_id, 48,
         {'series_name': 'MAG-45', 'color': 'black'},
         450, 300),
        ('ARL-MAG45-CON-FLEX-BK', 'Гибкий коннектор MAG-CON-4592-FLEX (BK)',
         'Гибкий соединитель до 180° для MAG-45, черный', 'connector_flexible', mag45_id, 48,
         {'series_name': 'MAG-45', 'color': 'black'},
         1290, 100),
        # 4TR соединители
        ('ARL-TR4-CON-L90-BK', 'Угловой соединитель TRACK-CON-4TR-L90 (BK)',
         'Угол 90° для TRACK-4TR, 220В', 'connector_angle', tr4_id, 220,
         {'angle_deg': 90, 'series_name': 'TRACK-4TR', 'color': 'black'},
         390, 80),
        ('ARL-TR4-CON-STR-BK', 'Прямой соединитель TRACK-CON-4TR-STR (BK)',
         'Прямой стык для TRACK-4TR', 'connector_straight', tr4_id, 220,
         {'series_name': 'TRACK-4TR', 'color': 'black'},
         190, 120),
    ]

    # ── Заглушки MAG-45 ──
    endcap_data = [
        ('ARL-MAG45-CAP-BK', 'Заглушка MAG-CAP-4592 (BK)',
         'Торцевая заглушка для MAG-45, черная', 'end_cap', mag45_id, None,
         {'series_name': 'MAG-45', 'color': 'black'}, 180, 500),
        ('ARL-MAG45-CAP-WH', 'Заглушка MAG-CAP-4592 (WH)',
         'Торцевая заглушка для MAG-45, белая', 'end_cap', mag45_id, None,
         {'series_name': 'MAG-45', 'color': 'white'}, 180, 300),
        ('ARL-TR4-CAP-BK', 'Заглушка TRACK-CAP-4TR (BK)',
         'Торцевая заглушка для TRACK-4TR', 'end_cap', tr4_id, None,
         {'series_name': 'TRACK-4TR', 'color': 'black'}, 90, 200),
    ]

    # ── Подвесы ──
    mount_data = [
        ('ARL-MAG45-SUSP10-BK', 'Подвес MAG-SUSPENSION-1000 (BK)',
         'Подвес 1м для MAG-45, черный', 'mount', mag45_id, None,
         {'series_name': 'MAG-45', 'color': 'black', 'length_m': 1.0}, 390, 150),
        ('ARL-MAG45-SUSP20-BK', 'Подвес MAG-SUSPENSION-2000 (BK)',
         'Подвес 2м для MAG-45, черный', 'mount', mag45_id, None,
         {'series_name': 'MAG-45', 'color': 'black', 'length_m': 2.0}, 590, 80),
        ('ARL-TR4-MOUNT-BK', 'Кронштейн TRACK-BRACKET-4TR (BK)',
         'Крепление для TRACK-4TR', 'mount', tr4_id, None,
         {'series_name': 'TRACK-4TR', 'color': 'black'}, 190, 200),
    ]

    # ── Токовводы ──
    inlet_data = [
        ('ARL-MAG45-INP-BK', 'Токоввод MAG-INPUT-4592 (BK)',
         'Кабельный ввод питания для MAG-45, 48В, черный', 'power_inlet', mag45_id, 48,
         {'series_name': 'MAG-45', 'color': 'black', 'voltage': 48}, 890, 120),
        ('ARL-TR4-INP-BK', 'Токоввод TRACK-INPUT-4TR (BK)',
         'Ввод питания для TRACK-4TR, 220В', 'power_inlet', tr4_id, 220,
         {'series_name': 'TRACK-4TR', 'color': 'black', 'voltage': 220}, 390, 80),
    ]

    # ── Блоки питания ──
    driver_data = [
        ('ARL-DRV-48-25W', 'Блок питания ARJ-SP-48-25 (25W, 48V)',
         'БП для MAG-45, 25Вт, 48В, диммируемый DALI', 'driver', mag45_id, 48,
         {'power_w': 25, 'output_voltage': 48, 'dimmable': True, 'control_protocol': 'DALI'}, 3290, 40),
        ('ARL-DRV-48-50W', 'Блок питания ARJ-SP-48-50 (50W, 48V)',
         'БП для MAG-45, 50Вт, 48В', 'driver', mag45_id, 48,
         {'power_w': 50, 'output_voltage': 48, 'dimmable': False}, 4590, 30),
        ('ARL-DRV-48-100W', 'Блок питания ARJ-SP-48-100 (100W, 48V)',
         'БП для MAG-45, 100Вт, 48В, DALI', 'driver', mag45_id, 48,
         {'power_w': 100, 'output_voltage': 48, 'dimmable': True, 'control_protocol': 'DALI'}, 7890, 20),
        ('ARL-DRV-220-DALI', 'Блок питания ARJ-TR-25-DALI (25W, 220V)',
         'БП для TRACK-4TR, 25Вт, 220В, DALI', 'driver', tr4_id, 220,
         {'power_w': 25, 'output_voltage': 220, 'dimmable': True, 'control_protocol': 'DALI'}, 2490, 35),
    ]

    # ── Контроллеры ──
    controller_data = [
        ('ARL-CTRL-DALI-BK', 'Контроллер MAG-DALI-4592 (BK)',
         'DALI контроллер для MAG-45, управление диммированием', 'controller', mag45_id, 48,
         {'protocol': 'DALI', 'series_name': 'MAG-45'}, 4590, 25),
    ]

    # ── Светильники MAG-45 (head) ──
    head_data = [
        ('ARL-MAG-FLAT-12W-24-BK', 'MAG-FLAT-45-L285-12W Day4000 (BK, 24deg, 48V)',
         'Светильник магнитный 12Вт, 4000К, угол 24°, 48В, черный', 'head', mag45_id, 48,
         {'power_w': 12, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'MAG-45', 'color': 'black'}, 3490, 60),
        ('ARL-MAG-FLAT-12W-60-BK', 'MAG-FLAT-45-L285-12W Day4000 (BK, 60deg, 48V)',
         'Светильник магнитный 12Вт, 4000К, угол 60°, 48В, черный', 'head', mag45_id, 48,
         {'power_w': 12, 'cct_k': 4000, 'beam_angle': 60, 'voltage': 48, 'series_name': 'MAG-45', 'color': 'black'}, 3490, 45),
        ('ARL-MAG-FLAT-20W-24-BK', 'MAG-FLAT-45-L405-20W Warm3000 (BK, 24deg, 48V)',
         'Светильник магнитный 20Вт, 3000К, угол 24°, 48В, черный', 'head', mag45_id, 48,
         {'power_w': 20, 'cct_k': 3000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'MAG-45', 'color': 'black'}, 4290, 35),
        ('ARL-MAG-FLAT-20W-DALI-BK', 'MAG-FLAT-45-L405-20W Day4000 (BK, 24deg, 48V, DALI)',
         'Светильник магнитный 20Вт, DALI, 48В, черный', 'head', mag45_id, 48,
         {'power_w': 20, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'dimmable': True, 'control_protocol': 'DALI', 'series_name': 'MAG-45', 'color': 'black'}, 5490, 20),
        ('ARL-MAG-SPOT-8W-BK', 'MAG-SPOT-45-R45-8W Day4000 (BK, 24deg, 48V)',
         'Споты магнитный 8Вт, 4000К, 48В, черный', 'head', mag45_id, 48,
         {'power_w': 8, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'MAG-45', 'color': 'black'}, 2490, 80),
        ('ARL-MAG-SPOT-8W-WH', 'MAG-SPOT-45-R45-8W Day4000 (WH, 24deg, 48V)',
         'Спот магнитный 8Вт, 4000К, 48В, белый', 'head', mag45_id, 48,
         {'power_w': 8, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'MAG-45', 'color': 'white'}, 2490, 50),
        # 220V head
        ('ARL-SP-TRACK-15W-BK', 'SP-TRACK-15W Day4000 (BK, 36deg, 220V)',
         'Трековый светильник 15Вт, 4000К, 220В, черный', 'head', tr4_id, 220,
         {'power_w': 15, 'cct_k': 4000, 'beam_angle': 36, 'voltage': 220, 'series_name': 'TRACK-4TR', 'color': 'black'}, 1890, 90),
        ('ARL-SP-TRACK-25W-BK', 'SP-TRACK-25W Warm3000 (BK, 36deg, 220V)',
         'Трековый светильник 25Вт, 3000К, 220В, черный', 'head', tr4_id, 220,
         {'power_w': 25, 'cct_k': 3000, 'beam_angle': 36, 'voltage': 220, 'series_name': 'TRACK-4TR', 'color': 'black'}, 2490, 70),
    ]

    arl_count = 0
    for d in [*track_data, *connector_data, *endcap_data, *mount_data, *inlet_data, *driver_data, *controller_data, *head_data]:
        upsert_product(cur, arl_id, *d)
        arl_count += 1

    conn.commit()
    results['arlight'] = {'added': arl_count}

    # ─── EGO LIGHTING ─────────────────────────────────────────────────────────
    cur.execute("SELECT id FROM suppliers WHERE code='ego'")
    row = cur.fetchone()
    if not row:
        conn.close()
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'ego supplier not found'})}
    ego_id = row[0]

    # Серии EGO
    ego48_id  = upsert_series(cur, ego_id, 'EGO-TRACK-48',  'EGO Track 48V',  48)
    ego220_id = upsert_series(cur, ego_id, 'EGO-TRACK-220', 'EGO Track 220V', 220)

    # ── Треки EGO 48V ──
    ego_tracks = [
        ('EGO-TR48-05-BK', 'Шинопровод EGO-TK-500 (черный, 48V)',
         'Трек магнитный EGO 0.5м 48В', 'track', ego48_id, 48,
         {'length_m': 0.5, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'black'},
         820, 90),
        ('EGO-TR48-10-BK', 'Шинопровод EGO-TK-1000 (черный, 48V)',
         'Трек магнитный EGO 1м 48В', 'track', ego48_id, 48,
         {'length_m': 1.0, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'black'},
         1290, 75),
        ('EGO-TR48-15-BK', 'Шинопровод EGO-TK-1500 (черный, 48V)',
         'Трек магнитный EGO 1.5м 48В', 'track', ego48_id, 48,
         {'length_m': 1.5, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'black'},
         1790, 50),
        ('EGO-TR48-20-BK', 'Шинопровод EGO-TK-2000 (черный, 48V)',
         'Трек магнитный EGO 2м 48В', 'track', ego48_id, 48,
         {'length_m': 2.0, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'black'},
         2190, 40),
        ('EGO-TR48-30-BK', 'Шинопровод EGO-TK-3000 (черный, 48V)',
         'Трек магнитный EGO 3м 48В', 'track', ego48_id, 48,
         {'length_m': 3.0, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'black'},
         2990, 25),
        ('EGO-TR48-10-WH', 'Шинопровод EGO-TK-1000 (белый, 48V)',
         'Трек магнитный EGO 1м 48В белый', 'track', ego48_id, 48,
         {'length_m': 1.0, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'white'},
         1290, 30),
        ('EGO-TR48-20-WH', 'Шинопровод EGO-TK-2000 (белый, 48V)',
         'Трек магнитный EGO 2м 48В белый', 'track', ego48_id, 48,
         {'length_m': 2.0, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'mount_type': 'surface', 'color': 'white'},
         2190, 20),
        # 220V
        ('EGO-TR220-10-BK', 'Шинопровод EGO-TK220-1000 (черный, 220V)',
         'Трек EGO 220В 1м', 'track', ego220_id, 220,
         {'length_m': 1.0, 'voltage': 220, 'series_name': 'EGO-TRACK-220', 'mount_type': 'surface', 'color': 'black'},
         490, 60),
        ('EGO-TR220-20-BK', 'Шинопровод EGO-TK220-2000 (черный, 220V)',
         'Трек EGO 220В 2м', 'track', ego220_id, 220,
         {'length_m': 2.0, 'voltage': 220, 'series_name': 'EGO-TRACK-220', 'mount_type': 'surface', 'color': 'black'},
         790, 45),
    ]

    # ── Соединители EGO ──
    ego_connectors = [
        ('EGO-CON48-L90-BK', 'Угловой соединитель EGO-CON-90 (черный, 48V)',
         'Угол 90° EGO Track 48В', 'connector_angle', ego48_id, 48,
         {'angle_deg': 90, 'series_name': 'EGO-TRACK-48', 'color': 'black'},
         790, 180),
        ('EGO-CON48-STR-BK', 'Прямой соединитель EGO-CON-STR (черный, 48V)',
         'Прямой стык EGO Track 48В', 'connector_straight', ego48_id, 48,
         {'series_name': 'EGO-TRACK-48', 'color': 'black'},
         390, 250),
        ('EGO-CON48-FLEX-BK', 'Гибкий коннектор EGO-CON-FLEX (черный, 48V)',
         'Гибкий соединитель EGO 48В', 'connector_flexible', ego48_id, 48,
         {'series_name': 'EGO-TRACK-48', 'color': 'black'},
         1090, 80),
        ('EGO-CON220-L90-BK', 'Угловой соединитель EGO-CON220-90 (черный)',
         'Угол 90° EGO Track 220В', 'connector_angle', ego220_id, 220,
         {'angle_deg': 90, 'series_name': 'EGO-TRACK-220', 'color': 'black'},
         350, 100),
        ('EGO-CON220-STR-BK', 'Прямой соединитель EGO-CON220-STR (черный)',
         'Прямой стык EGO Track 220В', 'connector_straight', ego220_id, 220,
         {'series_name': 'EGO-TRACK-220', 'color': 'black'},
         170, 150),
    ]

    # ── Заглушки EGO ──
    ego_caps = [
        ('EGO-CAP48-BK', 'Заглушка EGO-CAP-48 (черная)',
         'Торцевая заглушка EGO 48В', 'end_cap', ego48_id, None,
         {'series_name': 'EGO-TRACK-48', 'color': 'black'}, 150, 400),
        ('EGO-CAP220-BK', 'Заглушка EGO-CAP-220 (черная)',
         'Торцевая заглушка EGO 220В', 'end_cap', ego220_id, None,
         {'series_name': 'EGO-TRACK-220', 'color': 'black'}, 80, 300),
    ]

    # ── Подвесы EGO ──
    ego_mounts = [
        ('EGO-SUSP48-10-BK', 'Подвес EGO-SUSP-1000 (черный)',
         'Подвес 1м для EGO Track', 'mount', ego48_id, None,
         {'series_name': 'EGO-TRACK-48', 'color': 'black', 'length_m': 1.0}, 340, 120),
        ('EGO-SUSP48-20-BK', 'Подвес EGO-SUSP-2000 (черный)',
         'Подвес 2м для EGO Track', 'mount', ego48_id, None,
         {'series_name': 'EGO-TRACK-48', 'color': 'black', 'length_m': 2.0}, 490, 70),
    ]

    # ── Токовводы EGO ──
    ego_inlets = [
        ('EGO-INP48-BK', 'Токоввод EGO-INPUT-48 (черный)',
         'Кабельный ввод 48В EGO', 'power_inlet', ego48_id, 48,
         {'series_name': 'EGO-TRACK-48', 'voltage': 48, 'color': 'black'}, 790, 100),
        ('EGO-INP220-BK', 'Токоввод EGO-INPUT-220 (черный)',
         'Кабельный ввод 220В EGO', 'power_inlet', ego220_id, 220,
         {'series_name': 'EGO-TRACK-220', 'voltage': 220, 'color': 'black'}, 350, 80),
    ]

    # ── БП EGO ──
    ego_drivers = [
        ('EGO-DRV48-30W', 'Блок питания EGO-PS-48-30 (30W, 48V)',
         'БП EGO 30Вт 48В', 'driver', ego48_id, 48,
         {'power_w': 30, 'output_voltage': 48, 'dimmable': False}, 2890, 35),
        ('EGO-DRV48-60W', 'Блок питания EGO-PS-48-60 (60W, 48V)',
         'БП EGO 60Вт 48В диммируемый', 'driver', ego48_id, 48,
         {'power_w': 60, 'output_voltage': 48, 'dimmable': True, 'control_protocol': 'DALI'}, 4290, 25),
        ('EGO-DRV48-120W', 'Блок питания EGO-PS-48-120 (120W, 48V)',
         'БП EGO 120Вт 48В', 'driver', ego48_id, 48,
         {'power_w': 120, 'output_voltage': 48, 'dimmable': True, 'control_protocol': 'DALI'}, 6890, 15),
        ('EGO-DRV220-30W', 'Блок питания EGO-PS-220-30 (30W, 220V)',
         'БП EGO 30Вт 220В', 'driver', ego220_id, 220,
         {'power_w': 30, 'output_voltage': 220, 'dimmable': False}, 1990, 40),
    ]

    # ── Светильники EGO (head) ──
    ego_heads = [
        ('EGO-H48-10W-BK', 'EGO-SPOT-10W-4000K-BK (10W, 48V, 24deg)',
         'Трековый магнитный спот EGO 10Вт 4000К 48В черный', 'head', ego48_id, 48,
         {'power_w': 10, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'color': 'black'}, 2890, 70),
        ('EGO-H48-10W-WH', 'EGO-SPOT-10W-4000K-WH (10W, 48V, 24deg)',
         'Трековый магнитный спот EGO 10Вт 4000К 48В белый', 'head', ego48_id, 48,
         {'power_w': 10, 'cct_k': 4000, 'beam_angle': 24, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'color': 'white'}, 2890, 40),
        ('EGO-H48-15W-30K-BK', 'EGO-SPOT-15W-3000K-BK (15W, 48V, 36deg)',
         'Трековый магнитный 15Вт 3000К 48В черный', 'head', ego48_id, 48,
         {'power_w': 15, 'cct_k': 3000, 'beam_angle': 36, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'color': 'black'}, 3490, 50),
        ('EGO-H48-15W-DALI-BK', 'EGO-SPOT-15W-4000K-DALI-BK (15W, 48V, DALI)',
         'Трековый магнитный 15Вт DALI диммируемый 48В', 'head', ego48_id, 48,
         {'power_w': 15, 'cct_k': 4000, 'beam_angle': 36, 'voltage': 48, 'dimmable': True, 'control_protocol': 'DALI', 'series_name': 'EGO-TRACK-48', 'color': 'black'}, 4590, 30),
        ('EGO-H48-20W-BK', 'EGO-FLOOD-20W-4000K-BK (20W, 48V, 60deg)',
         'Трековый магнитный прожектор 20Вт 4000К 48В', 'head', ego48_id, 48,
         {'power_w': 20, 'cct_k': 4000, 'beam_angle': 60, 'voltage': 48, 'series_name': 'EGO-TRACK-48', 'color': 'black'}, 4190, 25),
        # 220V lights
        ('EGO-H220-15W-BK', 'EGO-TRACK-LIGHT-15W-4000K (15W, 220V)',
         'Трековый светильник EGO 15Вт 220В', 'head', ego220_id, 220,
         {'power_w': 15, 'cct_k': 4000, 'beam_angle': 36, 'voltage': 220, 'series_name': 'EGO-TRACK-220', 'color': 'black'}, 1590, 80),
        ('EGO-H220-25W-BK', 'EGO-TRACK-LIGHT-25W-3000K (25W, 220V)',
         'Трековый светильник EGO 25Вт 220В', 'head', ego220_id, 220,
         {'power_w': 25, 'cct_k': 3000, 'beam_angle': 36, 'voltage': 220, 'series_name': 'EGO-TRACK-220', 'color': 'black'}, 1990, 65),
    ]

    ego_count = 0
    for d in [*ego_tracks, *ego_connectors, *ego_caps, *ego_mounts, *ego_inlets, *ego_drivers, *ego_heads]:
        upsert_product(cur, ego_id, *d)
        ego_count += 1

    conn.commit()
    conn.close()
    results['ego'] = {'added': ego_count}

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'ok': True,
            'results': results,
            'total': sum(v['added'] for v in results.values()),
            'message': 'Demo data seeded successfully',
        }, ensure_ascii=False),
    }
