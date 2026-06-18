
CREATE TABLE t_p99554134_pro_trek_system_buil.suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    website VARCHAR(255),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p99554134_pro_trek_system_buil.series (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.suppliers(id),
    external_id VARCHAR(255),
    name VARCHAR(200) NOT NULL,
    voltage INTEGER,
    description TEXT,
    UNIQUE(supplier_id, external_id)
);

CREATE TABLE t_p99554134_pro_trek_system_buil.catalog_groups (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.suppliers(id),
    external_id VARCHAR(100) NOT NULL,
    name VARCHAR(200),
    parent_external_id VARCHAR(100),
    UNIQUE(supplier_id, external_id)
);

CREATE TABLE t_p99554134_pro_trek_system_buil.products (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.suppliers(id),
    article VARCHAR(100) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'accessory',
    series_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.series(id),
    brand VARCHAR(100),
    voltage INTEGER,
    unit VARCHAR(20) DEFAULT 'шт',
    obsolete INTEGER DEFAULT 0,
    image_id VARCHAR(255),
    has_ies BOOLEAN DEFAULT FALSE,
    raw_params JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, article)
);

CREATE TABLE t_p99554134_pro_trek_system_buil.product_params (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.products(id),
    param_name VARCHAR(100) NOT NULL,
    param_value TEXT,
    param_unit VARCHAR(50),
    param_number NUMERIC
);

CREATE TABLE t_p99554134_pro_trek_system_buil.price_stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.products(id) UNIQUE,
    price_retail NUMERIC(12,2),
    price_dealer NUMERIC(12,2),
    stock_qty NUMERIC(10,2) DEFAULT 0,
    stock_status VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p99554134_pro_trek_system_buil.product_relations (
    id SERIAL PRIMARY KEY,
    product_article VARCHAR(100) NOT NULL,
    related_article VARCHAR(100) NOT NULL,
    relation_type VARCHAR(50) DEFAULT 'accessory',
    supplier_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.suppliers(id)
);

CREATE TABLE t_p99554134_pro_trek_system_buil.projects (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100),
    name VARCHAR(200) DEFAULT 'Мой проект',
    step INTEGER DEFAULT 1,
    track_type VARCHAR(50),
    mount_type VARCHAR(50),
    voltage INTEGER,
    color VARCHAR(20),
    selected_supplier_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.suppliers(id),
    selected_series_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.series(id),
    state JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE t_p99554134_pro_trek_system_buil.project_constructions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.projects(id),
    sort_order INTEGER DEFAULT 0,
    shape VARCHAR(50) NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{}',
    total_length NUMERIC(8,2),
    corners_count INTEGER DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE
);

CREATE TABLE t_p99554134_pro_trek_system_buil.project_specs (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.projects(id),
    category VARCHAR(50),
    product_id INTEGER REFERENCES t_p99554134_pro_trek_system_buil.products(id),
    article VARCHAR(100),
    name VARCHAR(500),
    quantity NUMERIC(10,2),
    unit VARCHAR(20) DEFAULT 'шт',
    price NUMERIC(12,2),
    total_price NUMERIC(12,2),
    note TEXT,
    is_approximate BOOLEAN DEFAULT FALSE,
    angle_option VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_products_supplier ON t_p99554134_pro_trek_system_buil.products(supplier_id);
CREATE INDEX idx_products_category ON t_p99554134_pro_trek_system_buil.products(category);
CREATE INDEX idx_products_article ON t_p99554134_pro_trek_system_buil.products(article);
CREATE INDEX idx_products_series ON t_p99554134_pro_trek_system_buil.products(series_id);
CREATE INDEX idx_products_voltage ON t_p99554134_pro_trek_system_buil.products(voltage);
CREATE INDEX idx_product_params_product ON t_p99554134_pro_trek_system_buil.product_params(product_id);
CREATE INDEX idx_product_params_name ON t_p99554134_pro_trek_system_buil.product_params(param_name);
CREATE INDEX idx_relations_article ON t_p99554134_pro_trek_system_buil.product_relations(product_article);
CREATE INDEX idx_specs_project ON t_p99554134_pro_trek_system_buil.project_specs(project_id);
CREATE INDEX idx_constructions_project ON t_p99554134_pro_trek_system_buil.project_constructions(project_id);
CREATE INDEX idx_projects_session ON t_p99554134_pro_trek_system_buil.projects(session_id);
