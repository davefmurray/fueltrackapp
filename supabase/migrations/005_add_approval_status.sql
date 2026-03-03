-- Add approval workflow columns to mileage_logs
ALTER TABLE mileage_logs ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE mileage_logs ADD COLUMN reviewed_at TIMESTAMPTZ;
ALTER TABLE mileage_logs ADD COLUMN review_note TEXT;

-- Index for filtering by status (admin submissions page)
CREATE INDEX idx_mileage_logs_status ON mileage_logs (status);
