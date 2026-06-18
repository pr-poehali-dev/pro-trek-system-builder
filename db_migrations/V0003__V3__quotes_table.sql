
-- Счета / заказы
CREATE TABLE t_p99554134_pro_trek_system_buil.quotes (
    id          SERIAL PRIMARY KEY,
    number      VARCHAR(20) NOT NULL UNIQUE,  -- QT-2024-001
    status      VARCHAR(30) NOT NULL DEFAULT 'draft',
    -- Заказчик
    client_name     VARCHAR(200),
    client_phone    VARCHAR(50),
    client_email    VARCHAR(200),
    client_company  VARCHAR(200),
    client_address  VARCHAR(500),
    -- Объект
    object_name     VARCHAR(300),
    object_address  VARCHAR(500),
    room_type       VARCHAR(100),  -- квартира, офис, магазин, ресторан...
    -- Менеджер
    manager_name    VARCHAR(200),
    manager_phone   VARCHAR(50),
    -- Даты
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    valid_until     DATE,
    -- Связь с проектом
    project_id      INTEGER REFERENCES t_p99554134_pro_trek_system_buil.projects(id),
    -- Финансы
    total_amount    NUMERIC(14,2),
    discount_pct    NUMERIC(5,2) DEFAULT 0,
    tax_pct         NUMERIC(5,2) DEFAULT 0,
    notes           TEXT,
    -- Метаданные
    session_id      VARCHAR(100)
);

-- Статусы счёта (справочник)
CREATE TABLE t_p99554134_pro_trek_system_buil.quote_statuses (
    code        VARCHAR(30) PRIMARY KEY,
    label       VARCHAR(100) NOT NULL,
    color       VARCHAR(20) NOT NULL,  -- hex или название
    sort_order  INTEGER DEFAULT 0,
    is_terminal BOOLEAN DEFAULT FALSE
);

INSERT INTO t_p99554134_pro_trek_system_buil.quote_statuses (code, label, color, sort_order, is_terminal) VALUES
  ('draft',       'Черновик',           '#6b7280', 0,  false),
  ('new',         'Новый',              '#3d5afe', 10, false),
  ('in_progress', 'В работе',           '#f59e0b', 20, false),
  ('sent',        'Отправлен клиенту',  '#8b5cf6', 30, false),
  ('approved',    'Согласован',         '#10b981', 40, false),
  ('ordered',     'Заказан',            '#06b6d4', 50, false),
  ('completed',   'Выполнен',           '#00e676', 60, true),
  ('cancelled',   'Отменён',            '#ef4444', 70, true);

-- История изменений статуса
CREATE TABLE t_p99554134_pro_trek_system_buil.quote_history (
    id          SERIAL PRIMARY KEY,
    quote_id    INTEGER REFERENCES t_p99554134_pro_trek_system_buil.quotes(id),
    status      VARCHAR(30),
    comment     TEXT,
    changed_at  TIMESTAMPTZ DEFAULT NOW(),
    changed_by  VARCHAR(100)
);

-- Авто-нумерация счётов: последовательность
CREATE SEQUENCE IF NOT EXISTS t_p99554134_pro_trek_system_buil.quote_number_seq START 1;

CREATE INDEX idx_quotes_session ON t_p99554134_pro_trek_system_buil.quotes(session_id);
CREATE INDEX idx_quotes_status  ON t_p99554134_pro_trek_system_buil.quotes(status);
CREATE INDEX idx_quote_history  ON t_p99554134_pro_trek_system_buil.quote_history(quote_id);
