-- Data for testing ride matching between driver and passenger
-- Created for testing ABRA algorithm
-- Use: mysql -u [username] -p ridesharing_db < sample_ride_matching_data.sql

-- Clear existing test data (if needed)
DELETE FROM activities WHERE activity_chain_id IN (SELECT id FROM activity_chains WHERE name LIKE 'Test%');
DELETE FROM activity_chains WHERE name LIKE 'Test%';
DELETE FROM vehicles WHERE vehicle_number LIKE 'TEST%';
DELETE FROM users WHERE email LIKE 'test%@example.com';

-- Insert test users
INSERT INTO users (name, email, password, phone, timestamp) VALUES
('Nguyễn Văn A - Tài xế', 'test.driver@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', '0901234567', UNIX_TIMESTAMP()*1000),
('Trần Thị B - Hành khách', 'test.passenger@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', '0912345678', UNIX_TIMESTAMP()*1000);

-- Get the IDs of the inserted users
SET @driver_id = (SELECT id FROM users WHERE email = 'test.driver@example.com');
SET @passenger_id = (SELECT id FROM users WHERE email = 'test.passenger@example.com');

-- Insert vehicle for the driver
INSERT INTO vehicles (user_id, vehicle_name, vehicle_number, vehicle_color, vehicle_type, timestamp) VALUES
(@driver_id, 'Honda Civic', 'TEST-29A12345', 'Đỏ', 'Car', UNIX_TIMESTAMP()*1000);

-- Get the vehicle ID
SET @vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = 'TEST-29A12345');

-- Update the driver with the vehicle
UPDATE users SET vehicle_id = @vehicle_id WHERE id = @driver_id;

-- Insert activity chains
INSERT INTO activity_chains (user_id, name, timestamp) VALUES
(@driver_id, 'Test Driver Chain', UNIX_TIMESTAMP()*1000),
(@passenger_id, 'Test Passenger Chain', UNIX_TIMESTAMP()*1000);

-- Get the activity chain IDs
SET @driver_chain_id = (SELECT id FROM activity_chains WHERE user_id = @driver_id AND name = 'Test Driver Chain');
SET @passenger_chain_id = (SELECT id FROM activity_chains WHERE user_id = @passenger_id AND name = 'Test Passenger Chain');

-- Insert activities for driver (fixed schedule)
-- Activity 1: Start from Bộ Công an (47 Phạm Văn Đồng)
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @driver_chain_id, 'Xuất phát từ nhà', UNIX_TIMESTAMP('2025-05-10 07:35:00')*1000,
    'Bộ Công an, 47 Phạm Văn Đồng, Hà Nội', 21.075, 105.782,
    'Bộ Công an, 47 Phạm Văn Đồng, Hà Nội', 21.075, 105.782,
    300000, 0, 0, UNIX_TIMESTAMP()*1000
);

-- Activity 2: End at Mobifone (Cầu Giấy)
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @driver_chain_id, 'Đến nơi làm việc', UNIX_TIMESTAMP('2025-05-10 08:30:00')*1000,
    'Mobifone, Cầu Giấy, Hà Nội', 21.031, 105.792,
    'Mobifone, Cầu Giấy, Hà Nội', 21.031, 105.792,
    28800000, 0, 1, UNIX_TIMESTAMP()*1000
);

-- Insert activities for passenger (mix of fixed and flexible locations)
-- Activity 1: Start from Đại học Quốc gia Hà Nội
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @passenger_chain_id, 'Xuất phát từ trường đại học', UNIX_TIMESTAMP('2025-05-10 07:35:00')*1000,
    'Đại học Quốc gia Hà Nội, 144 Xuân Thủy, Cầu Giấy', 21.038, 105.783, 
    'Đại học Quốc gia Hà Nội, 144 Xuân Thủy, Cầu Giấy', 21.038, 105.783,
    300000, 0, 0, UNIX_TIMESTAMP()*1000
);

-- Activity 2: Flexible location - Shopping at supermarket
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @passenger_chain_id, 'Ghé siêu thị mua đồ (linh hoạt địa điểm)', UNIX_TIMESTAMP('2025-05-10 08:00:00')*1000,
    'Siêu thị gần đường đi', 21.036, 105.787,
    'Siêu thị gần đường đi', 21.036, 105.787,
    900000, 1, 1, UNIX_TIMESTAMP()*1000
);

-- Activity 3: Flexible location - Coffee break
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @passenger_chain_id, 'Uống cà phê (linh hoạt địa điểm)', UNIX_TIMESTAMP('2025-05-10 08:20:00')*1000,
    'Quán cà phê trên đường đi', 21.034, 105.789,
    'Quán cà phê trên đường đi', 21.034, 105.789,
    1200000, 1, 2, UNIX_TIMESTAMP()*1000
);

-- Activity 4: End at final destination
INSERT INTO activities (
    activity_chain_id, activity_name, activity_time, 
    start_place, start_lat, start_lon, 
    end_place, end_lat, end_lon, 
    duration, type, sequence_order, timestamp
) VALUES (
    @passenger_chain_id, 'Đến nơi làm việc', UNIX_TIMESTAMP('2025-05-10 09:00:00')*1000,
    '12 Dương Đình Nghệ, Cầu Giấy, Hà Nội', 21.024, 105.795,
    '12 Dương Đình Nghệ, Cầu Giấy, Hà Nội', 21.024, 105.795,
    28800000, 0, 3, UNIX_TIMESTAMP()*1000
);

-- Update the activity chains to indicate driver/passenger status
ALTER TABLE activity_chains ADD COLUMN IF NOT EXISTS is_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE activity_chains ADD COLUMN IF NOT EXISTS is_passenger BOOLEAN DEFAULT FALSE;

-- Mark the chains as driver/passenger
UPDATE activity_chains SET is_driver = TRUE WHERE id = @driver_chain_id;
UPDATE activity_chains SET is_passenger = TRUE WHERE id = @passenger_chain_id;

-- Additional information for flexible activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_time_flexible BOOLEAN DEFAULT FALSE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS poi_category VARCHAR(50) DEFAULT NULL;

-- Update flexible activities with additional info
UPDATE activities SET is_time_flexible = TRUE, poi_category = 'supermarket' 
WHERE activity_chain_id = @passenger_chain_id AND activity_name LIKE '%siêu thị%';

UPDATE activities SET is_time_flexible = TRUE, poi_category = 'cafe' 
WHERE activity_chain_id = @passenger_chain_id AND activity_name LIKE '%cà phê%';