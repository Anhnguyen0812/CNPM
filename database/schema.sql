-- Database: ridesharing_db (Create this database first if it doesn't exist)
CREATE DATABASE ridesharing_db;
USE ridesharing_db;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE, -- Assuming this is a Firebase UID or similar unique string
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048),        -- URL for profile picture
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL, -- Adding password column for authentication
    vehicle_id INT,           -- Can be NULL if user is not a driver or hasn't added a vehicle
    timestamp BIGINT NOT NULL,  -- Consider DATETIME or TIMESTAMP data type instead of BIGINT for actual timestamps
    -- Add other user profile fields if needed (e.g., preferences like smoking, gender for matching)
    INDEX (uid),
    INDEX (email),
    INDEX (phone)
    -- FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) -- Add this after vehicles table is created if direct link, or manage via application logic
);

-- Table: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,         -- Foreign key to users table
    vehicle_name VARCHAR(255),
    vehicle_number VARCHAR(50) UNIQUE,
    vehicle_color VARCHAR(50),
    vehicle_image VARCHAR(2048),
    vehicle_type VARCHAR(100),    -- e.g., 'Car', 'Motorbike', 'SUV'
    -- capacity INT,              -- Consider adding vehicle capacity if not in 'groups'
    timestamp BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (vehicle_number)
);

-- Now that vehicles table exists, we can add the foreign key to users if desired (or manage this relation purely in application logic)
-- ALTER TABLE users ADD CONSTRAINT fk_user_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;


-- Table: payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    card_number VARCHAR(255),      -- Store securely (e.g., last 4 digits, or use a payment gateway token)
    card_name VARCHAR(255),
    cvv VARCHAR(10),               -- Usually not stored for PCI compliance
    expire_month VARCHAR(2),
    expire_year VARCHAR(4),
    type INT,                      -- 0 for card, 1 for e-wallet, etc. (Consider ENUM or a separate payment_types table)
    timestamp BIGINT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE, -- To mark default payment method
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: activity_chains
CREATE TABLE IF NOT EXISTS activity_chains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255),          -- Optional name for the chain (e.g., "Daily Commute", "Weekend Trip")
    timestamp BIGINT NOT NULL,
    is_driver TINYINT(1),       -- Indicates if the user is a driver for this activity chain
    is_passenger TINYINT(1),    -- Indicates if the user is a passenger for this activity chain
    vehicle_details TEXT,       -- JSON or serialized details about the vehicle used
    passenger_preferences TEXT, -- JSON or serialized passenger preferences
    matched_driver_chain_id INT, -- Reference to a matched driver's activity chain
    match_timestamp BIGINT,     -- When the match was made
    group_id INT,               -- Reference to a group this chain belongs to
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: activities
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_chain_id INT NOT NULL,
    activity_name VARCHAR(255) NOT NULL,
    activity_time BIGINT NOT NULL,  -- Start time of the activity (as a UNIX timestamp or similar)
    start_place VARCHAR(255),     -- Name of the start location
    start_lat DOUBLE,
    start_lon DOUBLE,
    end_place VARCHAR(255),       -- Name of the end location (relevant if the activity itself is a 'trip' or has a defined endpoint for next leg)
    end_lat DOUBLE,
    end_lon DOUBLE,
    duration BIGINT NOT NULL,       -- Duration of the activity in seconds or minutes
    type INT,                     -- 0 for fixed location, 1 for flexible location (Consider ENUM or separate activity_types table)
    sequence_order INT NOT NULL DEFAULT 0, -- To maintain order within an activity_chain
    timestamp BIGINT NOT NULL,
    is_flexible TINYINT(1),       -- Indicates if the activity location is flexible
    poi_category VARCHAR(100),    -- Point of interest category if the activity is flexible
    matched_activity_id INT,      -- Reference to a matched activity
    FOREIGN KEY (activity_chain_id) REFERENCES activity_chains(id) ON DELETE CASCADE,
    INDEX (start_lat, start_lon),
    INDEX (end_lat, end_lon)
);

-- Table: groups (Represents a ride offered by a driver, or a carpool group)
CREATE TABLE IF NOT EXISTS groups_ (
    id INT AUTO_INCREMENT PRIMARY KEY,
    -- driver_id INT NOT NULL, -- It's better to explicitly link the driver here
    start_timestamp BIGINT NOT NULL, -- Departure time
    limit_passenger INT NOT NULL,
    type INT,                   -- 0 for activity-based match, 1 for trajectory-based match (type of matching this group is primarily for)
    status INT DEFAULT 0,       -- 0: Open, 1: Full, 2: In Progress, 3: Completed, 4: Cancelled
    timestamp BIGINT NOT NULL,  -- Creation timestamp
    -- Additional fields for trajectory-based rides:
    origin_name VARCHAR(255),
    origin_lat DOUBLE,
    origin_lon DOUBLE,
    destination_name VARCHAR(255),
    destination_lat DOUBLE,
    destination_lon DOUBLE,
    route_polyline TEXT,        -- Encoded polyline for the driver's intended route
    -- FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (start_timestamp),
    INDEX (origin_lat, origin_lon),
    INDEX (destination_lat, destination_lon)
);

-- Table: members (Links users to groups they are part of)
CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) NOT NULL,  -- Corresponds to users.uid (or users.id if you change users.uid to be the primary key)
    user_id INT NOT NULL,       -- Foreign key to users.id for easier joins if users.id is primary
    group_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'passenger', -- 'driver', 'passenger'
    join_timestamp BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_(id) ON DELETE CASCADE,
    UNIQUE (user_id, group_id) -- A user can only be a member of a group once
);


-- Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,         -- The user who made the booking (passenger)
    group_id INT NOT NULL,        -- The group/ride they booked
    payment_id INT,             -- Can be NULL if payment is cash or handled later
    status INT NOT NULL,          -- 0: Pending, 1: Confirmed, 2: Cancelled_by_user, 3: Cancelled_by_driver, 4: Completed
    type INT,                     -- Could denote booking type if needed (e.g., for a specific seat)
    booking_timestamp BIGINT NOT NULL,
    pickup_location_name VARCHAR(255),
    pickup_lat DOUBLE,
    pickup_lon DOUBLE,
    dropoff_location_name VARCHAR(255),
    dropoff_lat DOUBLE,
    dropoff_lon DOUBLE,
    fare DECIMAL(10, 2),          -- Fare for this specific booking
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (group_id) REFERENCES groups_(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- ---
-- Consider adding more specific indexes based on query patterns.
-- For example, on `activities(activity_chain_id, sequence_order)`.
-- For `groups`, if you frequently search by driver, add an index on `driver_id`.
-- Spatial indexes might be beneficial for location-based queries if your MySQL version supports them well and you have many records.
-- Example: ALTER TABLE activities ADD SPATIAL INDEX(start_location_point); -- where start_location_point is a POINT data type
-- ---

-- ---
-- NOTES:
-- 1. Timestamps: I've used BIGINT as per your diagram. It's often more convenient to use MySQL's `DATETIME` or `TIMESTAMP`
--    data types. If using BIGINT, ensure consistency (e.g., all are UNIX timestamps in seconds or milliseconds).
--    Example for DATETIME: `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
-- 2. UID in `users` vs `members`: Your `users` table has `id INT` and `uid VARCHAR`. The `members` table has `uid VARCHAR`.
--    If `users.id` is the true primary key for relationships, then `members` should have `user_id INT` as a foreign key.
--    I've added `user_id INT` to `members` and assumed `users.uid` is for external systems like Firebase. Adjust if `users.uid` is your internal primary key.
-- 3. Driver in `groups`: Your `groups` table doesn't explicitly have a `driver_id`. It's crucial. I've commented it in.
--    Alternatively, the driver is the first entry in the `members` table for that group with `role = 'driver'`.
-- 4. Security:
--    - For `payments.card_number` and `payments.cvv`, DO NOT store raw CVV. For card numbers, consider storing only the last 4 digits
--      and using a payment gateway token for actual transactions if you are processing payments directly.
--    - Ensure passwords (if stored, though not in this schema) are hashed securely.
-- 5. ENUMs vs INT for `type` fields: Using INT for `type` is flexible but requires application-level mapping (e.g., 0 means 'cash', 1 means 'card').
--    MySQL's `ENUM` type can be more descriptive directly in the database but is less flexible if types change often.
--    Alternatively, create separate lookup tables (e.g., `payment_types`, `activity_types`, `group_statuses`).
-- 6. `ON DELETE CASCADE` vs `ON DELETE SET NULL`: Choose based on your business logic. `CASCADE` means if a user is deleted, their vehicles, payments, etc., are also deleted. `SET NULL` would set the foreign key to NULL.
-- ---