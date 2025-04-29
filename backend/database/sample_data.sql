-- Sample data for ride sharing application

USE ride_sharing;

-- Insert sample users (mix of customers and drivers)
INSERT INTO users (email, password, name, phone, role, profile_picture) VALUES
('user1@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Nguyen Van A', '0901234567', 'customer', NULL),
('user2@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Tran Thi B', '0912345678', 'customer', NULL),
('user3@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Le Van C', '0923456789', 'driver', NULL),
('user4@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Pham Thi D', '0934567890', 'driver', NULL),
('user5@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Hoang Van E', '0945678901', 'customer', NULL),
('user6@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Do Thi F', '0956789012', 'driver', NULL),
('admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Admin User', '0999999999', 'admin', NULL);

-- Insert user profiles
INSERT INTO user_profiles (user_id, date_of_birth, gender, bio, address, preferences) VALUES
(1, '1995-05-15', 'male', 'Regular commuter', 'District 1, HCMC', '{"language": "vi", "notifications": true, "payment_preference": "cash"}'),
(2, '1997-08-20', 'female', 'Frequent traveler', 'District 2, HCMC', '{"language": "en", "notifications": true, "payment_preference": "credit_card"}'),
(3, '1990-03-10', 'male', 'Professional driver with 5 years experience', 'District 3, HCMC', '{"language": "vi", "notifications": true}'),
(4, '1992-11-25', 'female', 'Part-time driver', 'District 4, HCMC', '{"language": "vi", "notifications": true}'),
(5, '1998-01-05', 'male', 'Student', 'District 5, HCMC', '{"language": "vi", "notifications": false, "payment_preference": "momo"}'),
(6, '1989-07-30', 'male', 'Full-time driver with excellent service', 'District 7, HCMC', '{"language": "vi", "notifications": true}');

-- Insert vehicles for drivers
INSERT INTO vehicles (driver_id, model, year, license_plate, color, capacity, vehicle_type, is_active) VALUES
(3, 'Toyota Vios', 2020, '51A-12345', 'White', 4, 'car', TRUE),
(4, 'Honda Air Blade', 2021, '51B-67890', 'Red', 1, 'bike', TRUE),
(6, 'Kia Seltos', 2022, '51C-54321', 'Gray', 6, 'suv', TRUE),
(3, 'Honda Civic', 2019, '51D-09876', 'Black', 4, 'car', FALSE);

-- Insert activities
INSERT INTO activities (name, description, category) VALUES
('Daily Commute', 'Regular commuting to work or school', 'Commuting'),
('Weekend Shopping', 'Shopping trips during weekends', 'Shopping'),
('Airport Transfer', 'Rides to and from the airport', 'Travel'),
('City Tour', 'Exploring the city with shared rides', 'Tourism'),
('Late Night', 'Safe rides during late hours', 'Nightlife');

-- Insert sample rides
INSERT INTO rides (customer_id, driver_id, vehicle_id, activity_id, pickup_location, pickup_latitude, pickup_longitude, 
                  dropoff_location, dropoff_latitude, dropoff_longitude, status, distance, duration, price, 
                  ride_type, scheduled_time, actual_pickup_time, actual_dropoff_time) VALUES
(1, 3, 1, 1, 'District 1, HCMC', 10.7758, 106.7022, 'District 9, HCMC', 10.8416, 106.8091, 'completed', 15.3, 45, 150000, 
 'activity_based', '2025-04-27 08:00:00', '2025-04-27 08:05:00', '2025-04-27 08:50:00'),
 
(2, 6, 3, 3, 'District 2, HCMC', 10.7868, 106.7511, 'Tan Son Nhat Airport', 10.8155, 106.6645, 'completed', 18.7, 55, 220000, 
 'direct', '2025-04-27 14:30:00', '2025-04-27 14:32:00', '2025-04-27 15:27:00'),
 
(5, 4, 2, NULL, 'District 5, HCMC', 10.7555, 106.6692, 'District 7, HCMC', 10.7339, 106.7217, 'in_progress', 8.2, 30, 70000, 
 'direct', NULL, '2025-04-28 13:15:00', NULL),
 
(1, NULL, NULL, 2, 'District 1, HCMC', 10.7758, 106.7022, 'Aeon Mall, District 7', 10.7032, 106.7236, 'requested', 12.1, 40, 130000, 
 'activity_based', '2025-04-29 10:00:00', NULL, NULL);

-- Insert shared rides
INSERT INTO shared_rides (ride_id, passenger_id, pickup_location, pickup_latitude, pickup_longitude, 
                         dropoff_location, dropoff_latitude, dropoff_longitude, status, price) VALUES
(2, 5, 'District 3, HCMC', 10.7809, 106.6839, 'Tan Son Nhat Airport', 10.8155, 106.6645, 'completed', 170000);

-- Insert payment methods
INSERT INTO payment_methods (user_id, method_type, details, is_default) VALUES
(1, 'cash', '{}', TRUE),
(2, 'credit_card', '{"card_number": "************1234", "expiry": "05/27", "name": "TRAN THI B"}', TRUE),
(2, 'momo', '{"phone": "0912345678"}', FALSE),
(3, 'cash', '{}', TRUE),
(5, 'momo', '{"phone": "0945678901"}', TRUE),
(5, 'zalopay', '{"account_id": "user5zalopay"}', FALSE);

-- Insert payments
INSERT INTO payments (ride_id, payment_method_id, amount, status, transaction_id, payment_date) VALUES
(1, 1, 150000, 'completed', NULL, '2025-04-27 08:50:00'),
(2, 2, 220000, 'completed', 'TXN12345678', '2025-04-27 15:27:00');

-- Insert ratings
INSERT INTO ratings (ride_id, from_user_id, to_user_id, rating, comment) VALUES
(1, 1, 3, 4.5, 'Very good driver, car was clean'),
(1, 3, 1, 4.0, 'Nice customer, clear instructions'),
(2, 2, 6, 5.0, 'Excellent service and very professional'),
(2, 6, 2, 4.8, 'Great passenger');

-- Insert user locations
INSERT INTO user_locations (user_id, latitude, longitude, accuracy) VALUES
(3, 10.7758, 106.7022, 5.0),
(4, 10.7555, 106.6692, 3.5),
(6, 10.7868, 106.7511, 4.2);