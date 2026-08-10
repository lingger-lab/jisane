-- Atomic increment for owner.completed_deals to prevent TOCTOU race condition
-- (read-then-increment pattern under concurrent execution can lose updates)

CREATE OR REPLACE FUNCTION increment_completed_deals(
  p_owner_id UUID,
  p_increment INT DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE owner
  SET completed_deals = COALESCE(completed_deals, 0) + p_increment,
      updated_at = now()
  WHERE id = p_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
