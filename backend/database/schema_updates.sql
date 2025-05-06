-- Schema updates for Activity-Based and Profile-Trajectory Based Ridesharing

USE ride_sharing;

-- Enhanced user profiles with detailed preferences
ALTER TABLE user_profiles
MODIFY COLUMN preferences JSON COMMENT 'User preferences including smoking, music, conversation, etc.';

-- New table: User schedule for activity-based ridesharing
CREATE TABLE user_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Schedule name (e.g., "Weekday routine", "Weekend plan")',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User activities for activity-based ridesharing
CREATE TABLE user_activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL COMMENT 'Type of activity (e.g., work, shopping, gym)',
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days_of_week VARCHAR(20) NOT NULL COMMENT 'Comma-separated days (e.g., "1,2,3,4,5" for weekdays)',
    is_flexible BOOLEAN DEFAULT FALSE COMMENT 'Whether location is flexible',
    flexibility_radius INT DEFAULT 0 COMMENT 'Radius in meters for location flexibility',
    max_detour_time INT DEFAULT 0 COMMENT 'Maximum acceptable detour time in minutes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES user_schedules(id) ON DELETE CASCADE
);

-- Alternative locations for flexible activities
CREATE TABLE activity_alternative_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES user_activities(id) ON DELETE CASCADE
);

-- Trajectory data for profile and trajectory-based matching
CREATE TABLE user_trajectories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL COMMENT 'Trajectory name (e.g., "Home to Work")',
    origin_location VARCHAR(255) NOT NULL,
    origin_latitude DECIMAL(10, 8) NOT NULL,
    origin_longitude DECIMAL(11, 8) NOT NULL,
    destination_location VARCHAR(255) NOT NULL,
    destination_latitude DECIMAL(10, 8) NOT NULL,
    destination_longitude DECIMAL(11, 8) NOT NULL,
    usual_departure_time TIME,
    usual_days VARCHAR(20) COMMENT 'Comma-separated days (e.g., "1,2,3,4,5" for weekdays)',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Waypoints for trajectories
CREATE TABLE trajectory_waypoints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trajectory_id INT NOT NULL,
    sequence_number INT NOT NULL,
    location VARCHAR(255),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (trajectory_id) REFERENCES user_trajectories(id) ON DELETE CASCADE
);

-- ABRA ride matches (for activity-based matching)
CREATE TABLE abra_ride_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    driver_activity_id INT,
    passenger_activity_id INT NOT NULL,
    match_score DECIMAL(5, 2) NOT NULL COMMENT 'Score indicating match quality',
    estimated_detour_time INT COMMENT 'Estimated detour time in minutes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_activity_id) REFERENCES user_activities(id) ON DELETE SET NULL,
    FOREIGN KEY (passenger_activity_id) REFERENCES user_activities(id) ON DELETE CASCADE
);

-- Trajectory-based ride matches
CREATE TABLE trajectory_ride_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ride_id INT NOT NULL,
    driver_trajectory_id INT,
    passenger_trajectory_id INT NOT NULL,
    trajectory_similarity DECIMAL(5, 2) NOT NULL COMMENT 'Similarity score (0-1)',
    profile_compatibility DECIMAL(5, 2) NOT NULL COMMENT 'Compatibility score (0-1)',
    combined_score DECIMAL(5, 2) NOT NULL COMMENT 'Combined matching score',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_trajectory_id) REFERENCES user_trajectories(id) ON DELETE SET NULL,
    FOREIGN KEY (passenger_trajectory_id) REFERENCES user_trajectories(id) ON DELETE CASCADE
);

-- Add new ride types to the rides table
ALTER TABLE rides 
MODIFY COLUMN ride_type ENUM('activity_based', 'profile_based', 'trajectory_based', 'direct') NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_user_activities_schedule ON user_activities(schedule_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_trajectories_user ON user_trajectories(user_id);
CREATE INDEX idx_trajectory_waypoints_trajectory ON trajectory_waypoints(trajectory_id);