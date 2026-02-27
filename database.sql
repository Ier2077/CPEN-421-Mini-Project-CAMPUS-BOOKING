-- ================================================================
-- Campus Facility Booking System — Fresh Schema (with Auth)
-- ================================================================
DROP TABLE IF EXISTS bookings   CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'staff', 'admin')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE facilities (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    location   VARCHAR(150) NOT NULL,
    capacity   INT          NOT NULL CHECK (capacity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id          SERIAL      PRIMARY KEY,
    facility_id INT         NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id     INT         NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    date        DATE        NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed', 'cancelled', 'pending')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_bookings_facility_date ON bookings(facility_id, date);
CREATE INDEX idx_bookings_user_id       ON bookings(user_id);

-- All seed passwords = "password123"
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User',       'admin@ug.edu.gh',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
  ('Kwame Mensah',     'kwame.mensah@ug.edu.gh', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student'),
  ('Abena Asante',     'abena.asante@ug.edu.gh', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student'),
  ('Dr. Kofi Boateng', 'k.boateng@ug.edu.gh',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'staff'),
  ('Ama Owusu',        'ama.owusu@ug.edu.gh',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student');

INSERT INTO facilities (name, location, capacity) VALUES
  ('Engineering Lecture Hall A', 'Faculty of Engineering, Block A', 120),
  ('Computer Lab 1',             'Faculty of Engineering, Block B', 40),
  ('Seminar Room 3',             'Faculty of Engineering, Block C', 25),
  ('Project Room 2',             'Faculty of Engineering, Block D', 12),
  ('Main Conference Room',       'Administration Block, 2nd Floor', 50);

INSERT INTO bookings (facility_id, user_id, date, start_time, end_time, status) VALUES
  (1, 4, CURRENT_DATE + 1, '08:00', '10:00', 'confirmed'),
  (2, 2, CURRENT_DATE + 1, '10:00', '12:00', 'confirmed'),
  (3, 3, CURRENT_DATE + 1, '13:00', '14:30', 'confirmed'),
  (4, 2, CURRENT_DATE + 2, '14:00', '16:00', 'confirmed');
