-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gas_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Block all direct access — everything goes through service role via API routes
-- No policies means anon/authenticated roles cannot read or write directly
-- The service_role key bypasses RLS automatically
