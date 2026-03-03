-- Enable pgcrypto for bcrypt PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Employees table
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  commute_miles NUMERIC(6,1) NOT NULL DEFAULT 40.2,
  vehicle_mpg NUMERIC(4,1) NOT NULL DEFAULT 15.0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mileage logs table
CREATE TABLE mileage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  start_miles NUMERIC(8,1),
  end_miles NUMERIC(8,1),
  start_photo_url TEXT,
  end_photo_url TEXT,
  start_timestamp TIMESTAMPTZ,
  end_timestamp TIMESTAMPTZ,
  start_lat DOUBLE PRECISION,
  start_lng DOUBLE PRECISION,
  end_lat DOUBLE PRECISION,
  end_lng DOUBLE PRECISION,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, log_date),
  CONSTRAINT end_gte_start CHECK (end_miles IS NULL OR start_miles IS NULL OR end_miles >= start_miles)
);

-- Gas prices table (monthly AAA Florida price)
CREATE TABLE gas_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2024),
  price_per_gallon NUMERIC(4,3) NOT NULL CHECK (price_per_gallon > 0),
  set_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

-- App settings (key-value store)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES
  ('company_name', 'JJ Service Fixed Operations LLC'),
  ('work_days', '[1,2,3,4,5]'),
  ('timezone', 'America/New_York');

-- Indexes
CREATE INDEX idx_mileage_logs_employee_date ON mileage_logs(employee_id, log_date DESC);
CREATE INDEX idx_mileage_logs_date ON mileage_logs(log_date);
CREATE INDEX idx_employees_active ON employees(active);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER mileage_logs_updated_at
  BEFORE UPDATE ON mileage_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
