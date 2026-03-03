-- Create private bucket for odometer photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('odometer-photos', 'odometer-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Only service role can access (no public policies)
-- Photos are served via signed URLs generated in API routes
