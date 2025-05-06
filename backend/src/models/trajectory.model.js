const db = require('../config/db.config');
const User = require('./user.model');
const Ride = require('./ride.model');

class TrajectoryMatcher {
  // Calculate Hausdorff distance between two trajectories
  static hausdorffDistance(trajectory1, trajectory2) {
    const points1 = this.extractPoints(trajectory1);
    const points2 = this.extractPoints(trajectory2);
    
    // Calculate max distance from each point in trajectory1 to closest point in trajectory2
    const d1to2 = Math.max(...points1.map(p1 => 
      Math.min(...points2.map(p2 => this.geoDistance(p1, p2)))
    ));
    
    // Calculate max distance from each point in trajectory2 to closest point in trajectory1
    const d2to1 = Math.max(...points2.map(p2 => 
      Math.min(...points1.map(p1 => this.geoDistance(p1, p2)))
    ));
    
    // Return the maximum of the two distances
    return Math.max(d1to2, d2to1);
  }
  
  // Extract points from trajectory (including waypoints)
  static extractPoints(trajectory) {
    const points = [
      { lat: trajectory.origin_latitude, lng: trajectory.origin_longitude }
    ];
    
    // Add waypoints if available
    if (trajectory.waypoints && trajectory.waypoints.length > 0) {
      points.push(...trajectory.waypoints.map(wp => ({
        lat: wp.latitude, 
        lng: wp.longitude
      })));
    }
    
    points.push({
      lat: trajectory.destination_latitude,
      lng: trajectory.destination_longitude
    });
    
    return points;
  }
  
  // Calculate geo distance between two points using Haversine formula
  static geoDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    
    const lat1 = this.toRadians(point1.lat);
    const lat2 = this.toRadians(point2.lat);
    const deltaLat = this.toRadians(point2.lat - point1.lat);
    const deltaLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  // Convert degrees to radians
  static toRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  
  // Calculate trajectory similarity (inverted and normalized Hausdorff distance)
  static calculateTrajectorySimilarity(trajectory1, trajectory2) {
    const distance = this.hausdorffDistance(trajectory1, trajectory2);
    
    // Convert distance to similarity score (0-1)
    // Small distances = high similarity
    const maxDistance = 50; // Maximum meaningful distance in km
    const similarity = Math.max(0, 1 - (distance / maxDistance));
    
    return similarity;
  }
  
  // Calculate temporal compatibility based on usual departure times and days
  static calculateTemporalCompatibility(trajectory1, trajectory2) {
    let compatibilityScore = 0;
    
    // Check usual departure time compatibility (within 30 minutes)
    const time1 = new Date(`1970-01-01T${trajectory1.usual_departure_time}`);
    const time2 = new Date(`1970-01-01T${trajectory2.usual_departure_time}`);
    
    const timeDiffMs = Math.abs(time1 - time2);
    const timeDiffMinutes = timeDiffMs / (1000 * 60);
    
    const timeScore = Math.max(0, 1 - (timeDiffMinutes / 30));
    
    // Check usual days compatibility
    const days1 = trajectory1.usual_days.split(',').map(d => d.trim());
    const days2 = trajectory2.usual_days.split(',').map(d => d.trim());
    
    const commonDays = days1.filter(day => days2.includes(day));
    const dayScore = commonDays.length / Math.max(days1.length, days2.length);
    
    // Combine scores with more weight on days
    compatibilityScore = (timeScore * 0.4) + (dayScore * 0.6);
    
    return compatibilityScore;
  }
  
  // Calculate user profile compatibility
  static async calculateProfileCompatibility(userId1, userId2) {
    try {
      // Get user profile data
      const user1 = await User.getUserById(userId1);
      const user2 = await User.getUserById(userId2);
      
      if (!user1 || !user2) {
        return 0;
      }
      
      let compatibilityScore = 0;
      let factorsCount = 0;
      
      // Check age compatibility
      if (user1.age && user2.age) {
        const ageDiff = Math.abs(user1.age - user2.age);
        const ageScore = Math.max(0, 1 - (ageDiff / 30)); // Age diff of 30 years gives score of 0
        compatibilityScore += ageScore;
        factorsCount++;
      }
      
      // Check gender preference compatibility
      if (user1.gender_preference && user2.gender) {
        if (user1.gender_preference === 'any' || user1.gender_preference === user2.gender) {
          compatibilityScore += 1;
        }
        factorsCount++;
      }
      
      if (user2.gender_preference && user1.gender) {
        if (user2.gender_preference === 'any' || user2.gender_preference === user1.gender) {
          compatibilityScore += 1;
        }
        factorsCount++;
      }
      
      // Check smoking preference compatibility
      if (user1.smoking_preference && user2.smoking_preference) {
        if (
          (user1.smoking_preference === 'no_preference') ||
          (user2.smoking_preference === 'no_preference') ||
          (user1.smoking_preference === user2.smoking_preference)
        ) {
          compatibilityScore += 1;
        }
        factorsCount++;
      }
      
      // Check music preference compatibility
      if (user1.music_preference && user2.music_preference) {
        if (
          (user1.music_preference === 'no_preference') ||
          (user2.music_preference === 'no_preference') ||
          (user1.music_preference === user2.music_preference)
        ) {
          compatibilityScore += 1;
        }
        factorsCount++;
      }
      
      // Check pet preference compatibility
      if (user1.pet_preference && user2.pet_preference) {
        if (
          (user1.pet_preference === 'no_preference') ||
          (user2.pet_preference === 'no_preference') ||
          (user1.pet_preference === user2.pet_preference)
        ) {
          compatibilityScore += 1;
        }
        factorsCount++;
      }
      
      // Check talkativeness compatibility
      if (user1.talkativeness && user2.talkativeness) {
        const talkDiff = Math.abs(
          this.talkativenessToNumber(user1.talkativeness) - 
          this.talkativenessToNumber(user2.talkativeness)
        );
        const talkScore = Math.max(0, 1 - (talkDiff / 2)); // Difference of 2 levels gives 0
        compatibilityScore += talkScore;
        factorsCount++;
      }
      
      // Normalize the score
      return factorsCount > 0 ? compatibilityScore / factorsCount : 0;
    } catch (error) {
      console.error('Error calculating profile compatibility:', error);
      return 0;
    }
  }
  
  // Convert talkativeness level to number
  static talkativenessToNumber(talkativeness) {
    const levels = {
      'silent': 0,
      'quiet': 1,
      'moderate': 2,
      'talkative': 3,
      'very_talkative': 4
    };
    
    return levels[talkativeness] || 2; // Default to moderate
  }
  
  // Find trajectory matches for a user
  static async findTrajectoryMatches(userId, trajectoryId = null, minSimilarity = 0.6) {
    try {
      // Get user trajectories
      let userTrajectories = [];
      if (trajectoryId) {
        const trajectory = await db.query(
          'SELECT * FROM user_trajectories WHERE id = $1 AND user_id = $2',
          [trajectoryId, userId]
        );
        if (trajectory.rows.length > 0) {
          userTrajectories = trajectory.rows;
        }
      } else {
        const trajectories = await User.getUserTrajectories(userId);
        userTrajectories = trajectories || [];
      }
      
      if (userTrajectories.length === 0) {
        return [];
      }
      
      // Get user role
      const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
      const userRole = userResult.rows[0]?.role || 'passenger';
      
      // Get all trajectories from other users with opposite role
      const oppositeRole = userRole === 'driver' ? 'passenger' : 'driver';
      
      const otherTrajectories = await db.query(
        `SELECT t.*, u.id AS user_id, u.first_name, u.last_name, u.profile_picture, u.rating
         FROM user_trajectories t
         JOIN users u ON t.user_id = u.id
         WHERE u.id != $1 AND u.role = $2`,
        [userId, oppositeRole]
      );
      
      if (otherTrajectories.rows.length === 0) {
        return [];
      }
      
      // Calculate matches
      const allMatches = [];
      
      for (const userTrajectory of userTrajectories) {
        for (const otherTrajectory of otherTrajectories.rows) {
          // Calculate trajectory similarity
          const similarity = this.calculateTrajectorySimilarity(userTrajectory, otherTrajectory);
          
          // Filter by minimum similarity
          if (similarity >= minSimilarity) {
            // Calculate temporal compatibility
            const temporalCompatibility = this.calculateTemporalCompatibility(
              userTrajectory, 
              otherTrajectory
            );
            
            // Calculate profile compatibility
            const profileCompatibility = await this.calculateProfileCompatibility(
              userId,
              otherTrajectory.user_id
            );
            
            // Calculate combined score
            // Weights: route similarity (50%), temporal (30%), profile (20%)
            const combinedScore = (
              (similarity * 0.5) + 
              (temporalCompatibility * 0.3) + 
              (profileCompatibility * 0.2)
            );
            
            allMatches.push({
              user_trajectory: userTrajectory,
              matched_trajectory: otherTrajectory,
              matched_user: {
                id: otherTrajectory.user_id,
                first_name: otherTrajectory.first_name,
                last_name: otherTrajectory.last_name,
                profile_picture: otherTrajectory.profile_picture,
                rating: otherTrajectory.rating
              },
              similarity: parseFloat(similarity.toFixed(2)),
              temporal_compatibility: parseFloat(temporalCompatibility.toFixed(2)),
              profile_compatibility: parseFloat(profileCompatibility.toFixed(2)),
              combined_score: parseFloat(combinedScore.toFixed(2))
            });
          }
        }
      }
      
      // Sort matches by combined score
      allMatches.sort((a, b) => b.combined_score - a.combined_score);
      
      return allMatches;
    } catch (error) {
      console.error('Error finding trajectory matches:', error);
      throw error;
    }
  }
  
  // Create a trajectory-based ride
  static async createTrajectoryBasedRide(rideData) {
    try {
      const {
        customer_id,
        driver_id,
        vehicle_id,
        pickup_location,
        pickup_latitude,
        pickup_longitude,
        dropoff_location,
        dropoff_latitude,
        dropoff_longitude,
        distance,
        duration,
        price,
        scheduled_time,
        passenger_trajectory_id,
        driver_trajectory_id,
        trajectory_similarity,
        profile_compatibility,
        combined_score
      } = rideData;
      
      // Create the ride first
      const rideResult = await db.query(
        `INSERT INTO rides (
          customer_id, driver_id, vehicle_id, pickup_location, pickup_latitude, 
          pickup_longitude, dropoff_location, dropoff_latitude, dropoff_longitude, 
          distance, duration, price, status, scheduled_time, ride_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
        RETURNING *`,
        [
          customer_id, driver_id, vehicle_id, pickup_location, pickup_latitude,
          pickup_longitude, dropoff_location, dropoff_latitude, dropoff_longitude,
          distance, duration, price, 'pending', scheduled_time, 'trajectory'
        ]
      );
      
      const ride = rideResult.rows[0];
      
      // Create trajectory match entry
      await db.query(
        `INSERT INTO trajectory_matches (
          ride_id, passenger_trajectory_id, driver_trajectory_id,
          trajectory_similarity, profile_compatibility, combined_score
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ride.id, passenger_trajectory_id, driver_trajectory_id,
          trajectory_similarity, profile_compatibility, combined_score
        ]
      );
      
      return ride;
    } catch (error) {
      console.error('Error creating trajectory-based ride:', error);
      throw error;
    }
  }
  
  // Get user's upcoming trajectory rides
  static async getUserUpcomingTrajectoryRides(userId, userRole) {
    try {
      const userColumn = userRole === 'driver' ? 'driver_id' : 'customer_id';
      
      const rides = await db.query(
        `SELECT r.*, tm.passenger_trajectory_id, tm.driver_trajectory_id,
         tm.trajectory_similarity, tm.profile_compatibility, tm.combined_score,
         c.first_name AS customer_first_name, c.last_name AS customer_last_name,
         c.profile_picture AS customer_profile_picture,
         d.first_name AS driver_first_name, d.last_name AS driver_last_name,
         d.profile_picture AS driver_profile_picture,
         v.make, v.model, v.color, v.license_plate
         FROM rides r
         LEFT JOIN trajectory_matches tm ON r.id = tm.ride_id
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         WHERE r.${userColumn} = $1 
         AND r.ride_type = 'trajectory'
         AND r.status IN ('pending', 'accepted')
         AND r.scheduled_time >= NOW()
         ORDER BY r.scheduled_time ASC`,
        [userId]
      );
      
      return rides.rows;
    } catch (error) {
      console.error('Error getting upcoming trajectory rides:', error);
      throw error;
    }
  }
  
  // Get user's trajectory ride history
  static async getUserTrajectoryRideHistory(userId, userRole, limit = 10, offset = 0) {
    try {
      const userColumn = userRole === 'driver' ? 'driver_id' : 'customer_id';
      
      const rides = await db.query(
        `SELECT r.*, tm.passenger_trajectory_id, tm.driver_trajectory_id,
         tm.trajectory_similarity, tm.profile_compatibility, tm.combined_score,
         c.first_name AS customer_first_name, c.last_name AS customer_last_name,
         c.profile_picture AS customer_profile_picture,
         d.first_name AS driver_first_name, d.last_name AS driver_last_name,
         d.profile_picture AS driver_profile_picture,
         v.make, v.model, v.color, v.license_plate
         FROM rides r
         LEFT JOIN trajectory_matches tm ON r.id = tm.ride_id
         LEFT JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         WHERE r.${userColumn} = $1 
         AND r.ride_type = 'trajectory'
         AND (r.status IN ('completed', 'cancelled', 'rejected') 
              OR r.scheduled_time < NOW())
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return rides.rows;
    } catch (error) {
      console.error('Error getting trajectory ride history:', error);
      throw error;
    }
  }
  
  // Update trajectory ride status
  static async updateTrajectoryRideStatus(rideId, status, additionalData = {}) {
    try {
      // Start a transaction
      await db.query('BEGIN');
      
      let updateFields = ['status = $1'];
      let updateValues = [status];
      let paramIndex = 2;
      
      // Add additional data fields if provided
      if (additionalData.actual_pickup_time) {
        updateFields.push(`actual_pickup_time = $${paramIndex}`);
        updateValues.push(additionalData.actual_pickup_time);
        paramIndex++;
      }
      
      if (additionalData.actual_dropoff_time) {
        updateFields.push(`actual_dropoff_time = $${paramIndex}`);
        updateValues.push(additionalData.actual_dropoff_time);
        paramIndex++;
      }
      
      if (additionalData.actual_distance) {
        updateFields.push(`actual_distance = $${paramIndex}`);
        updateValues.push(additionalData.actual_distance);
        paramIndex++;
      }
      
      if (additionalData.actual_duration) {
        updateFields.push(`actual_duration = $${paramIndex}`);
        updateValues.push(additionalData.actual_duration);
        paramIndex++;
      }
      
      if (additionalData.final_price) {
        updateFields.push(`final_price = $${paramIndex}`);
        updateValues.push(additionalData.final_price);
        paramIndex++;
      }
      
      // Update the ride
      const updateQuery = `
        UPDATE rides 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex} AND ride_type = 'trajectory'
        RETURNING *
      `;
      
      updateValues.push(rideId);
      
      const updatedRide = await db.query(updateQuery, updateValues);
      
      // If ride completed, update user ratings if provided
      if (status === 'completed' && additionalData.ratings) {
        if (additionalData.ratings.driver_rating) {
          await Ride.rateDriver(
            rideId, 
            additionalData.ratings.driver_rating,
            additionalData.ratings.driver_comment || ''
          );
        }
        
        if (additionalData.ratings.passenger_rating) {
          await Ride.ratePassenger(
            rideId, 
            additionalData.ratings.passenger_rating,
            additionalData.ratings.passenger_comment || ''
          );
        }
      }
      
      // Commit the transaction
      await db.query('COMMIT');
      
      return updatedRide.rows[0];
    } catch (error) {
      // Rollback in case of error
      await db.query('ROLLBACK');
      console.error('Error updating trajectory ride status:', error);
      throw error;
    }
  }
  
  // Get trajectory match details
  static async getTrajectoryMatchDetails(rideId) {
    try {
      const matchResult = await db.query(
        `SELECT tm.*, 
         pt.origin_location AS passenger_origin, 
         pt.destination_location AS passenger_destination,
         pt.usual_departure_time AS passenger_usual_time,
         pt.usual_days AS passenger_usual_days,
         dt.origin_location AS driver_origin,
         dt.destination_location AS driver_destination,
         dt.usual_departure_time AS driver_usual_time,
         dt.usual_days AS driver_usual_days,
         r.status, r.scheduled_time, r.price
         FROM trajectory_matches tm
         JOIN rides r ON tm.ride_id = r.id
         JOIN user_trajectories pt ON tm.passenger_trajectory_id = pt.id
         JOIN user_trajectories dt ON tm.driver_trajectory_id = dt.id
         WHERE tm.ride_id = $1`,
        [rideId]
      );
      
      if (matchResult.rows.length === 0) {
        return null;
      }
      
      return matchResult.rows[0];
    } catch (error) {
      console.error('Error getting trajectory match details:', error);
      throw error;
    }
  }
}

module.exports = TrajectoryMatcher;