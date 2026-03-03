-- Hash a 4-digit PIN using bcrypt
CREATE OR REPLACE FUNCTION hash_pin(pin TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(pin, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify a PIN against a stored hash
CREATE OR REPLACE FUNCTION verify_pin(pin TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN crypt(pin, hash) = hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Login: find active employee by PIN, return id and name
CREATE OR REPLACE FUNCTION employee_pin_login(input_pin TEXT)
RETURNS TABLE(employee_id UUID, employee_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name
  FROM employees e
  WHERE e.active = true
    AND verify_pin(input_pin, e.pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
