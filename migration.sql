-- ================================================================
-- MIGRATION: Add authentication to campus_booking database
-- Run this in pgAdmin Query Tool on your existing campus_booking DB
-- ================================================================

-- STEP 1: Add password_hash column to users (if it doesn't exist yet)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- STEP 2: Set a default hash for existing users so NOT NULL works
-- This is the bcrypt hash of "password123" — users will change on first login
UPDATE users
  SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
  WHERE password_hash IS NULL;

-- STEP 3: Now enforce NOT NULL
ALTER TABLE users
  ALTER COLUMN password_hash SET NOT NULL;

-- STEP 4: Add index on bookings.user_id for fast "my bookings" queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- STEP 5: Verify the result
SELECT id, name, email, role,
       LEFT(password_hash, 20) || '...' AS hash_preview
FROM users;

-- ================================================================
-- DONE. All existing users can now log in with: password123
-- They should change their password after first login.
-- ================================================================
