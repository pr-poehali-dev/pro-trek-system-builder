CREATE TABLE IF NOT EXISTS t_p99554134_pro_trek_system_buil.supplier_systems (
  supplier_code TEXT NOT NULL,
  system_index  INT  NOT NULL,
  system_name   TEXT NOT NULL,
  voltage       TEXT NOT NULL,
  wires         TEXT NOT NULL,
  mount_types   TEXT[] NOT NULL DEFAULT '{}',
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (supplier_code, system_index)
);