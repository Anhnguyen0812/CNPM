const { pool } = require('../config/db.config');
const geolib = require('geolib');

// Activity-Based Ridesharing Algorithm model
const ABRA = {
  // Generate trip chains from user activities
  generateTripChains: async (userId, date) => {
    try {
      // Get all user schedules
      const [schedules] = await pool.execute(
        'SELECT * FROM user_schedules WHERE user_id = ? AND is_active = TRUE',
        [userId]
      );
      
      if (schedules.length === 0) {
        return [];
      }
      
      const scheduleIds = schedules.map(s => s.id);
      
      // Get day of week (1-7, where 1 is Monday)
      const dayOfWeek = new Date(date).getDay() === 0 ? 7 : new Date(date).getDay();
      
      // Get activities for these schedules that occur on this day
      const [activities] = await pool.execute(
        `SELECT * FROM user_activities 
         WHERE schedule_id IN (${scheduleIds.map(() => '?').join(',')})
         AND FIND_IN_SET(?, days_of_week)
         ORDER BY start_time`,
        [...scheduleIds, dayOfWeek.toString()]
      );
      
      if (activities.length < 2) {
        return []; // Need at least 2 activities to form a trip
      }
      
      // Form trip chains (pairs of consecutive activities)
      const tripChains = [];
      for (let i = 0; i < activities.length - 1; i++) {
        tripChains.push({
          origin_activity: activities[i],
          destination_activity: activities[i + 1],
          date: date,
          departure_time: activities[i].end_time,
          arrival_time: activities[i + 1].start_time
        });
      }
      
      return tripChains;
    } catch (error) {
      throw error;
    }
  },
  
  // Find alternative locations for flexible activities
  findAlternativeLocations: async (activityId, maxRadius) => {
    try {
      // Get the activity
      const [activities] = await pool.execute(
        'SELECT * FROM user_activities WHERE id = ?',
        [activityId]
      );
      
      if (activities.length === 0) {
        return [];
      }
      
      const activity = activities[0];
      
      // If activity is not flexible, return empty array
      if (!activity.is_flexible) {
        return [];
      }
      
      // Get already defined alternative locations
      const [alternativeLocations] = await pool.execute(
        'SELECT * FROM activity_alternative_locations WHERE activity_id = ?',
        [activityId]
      );
      
      // Get radius to search for, use provided radius or activity's flexibility radius
      const radius = maxRadius || activity.flexibility_radius || 1000; // default 1km
      
      // For demonstration purposes, we'll use existing points of interest
      // In a real implementation, this would query a POI database or use a mapping API
      const [pointsOfInterest] = await pool.execute(
        `SELECT name as location, latitude, longitude 
         FROM (
           SELECT pickup_location as name, pickup_latitude as latitude, pickup_longitude as longitude FROM rides
           UNION
           SELECT dropoff_location as name, dropoff_latitude as latitude, dropoff_longitude as longitude FROM rides
         ) as locations
         GROUP BY name, latitude, longitude
         LIMIT 50`
      );
      
      // Filter POIs by distance and activity type
      // For this example, we'll just filter by distance
      const nearbyPOIs = pointsOfInterest.filter(poi => {
        const distance = geolib.getDistance(
          { latitude: activity.latitude, longitude: activity.longitude },
          { latitude: poi.latitude, longitude: poi.longitude }
        );
        return distance <= radius;
      });
      
      // Combine with existing alternative locations
      const allAlternatives = [
        ...alternativeLocations,
        ...nearbyPOIs.map(poi => ({
          activity_id: activityId,
          location: poi.location,
          latitude: poi.latitude,
          longitude: poi.longitude
        }))
      ];
      
      return allAlternatives;
    } catch (error) {
      throw error;
    }
  },
  
  // Find potential ride matches based on activity schedules
  findActivityBasedMatches: async (userId, date, maxDetourMinutes = 15, maxDistanceKm = 5) => {
    try {
      // Get user's trip chains for the day
      const userTripChains = await this.generateTripChains(userId, date);
      
      if (userTripChains.length === 0) {
        return [];
      }
      
      // For each trip chain, find potential matches
      let allMatches = [];
      
      for (const tripChain of userTripChains) {
        // Get day of week (1-7, where 1 is Monday)
        const dayOfWeek = new Date(date).getDay() === 0 ? 7 : new Date(date).getDay();
        
        // Find activities from other users that overlap in time
        const [potentialMatches] = await pool.execute(
          `SELECT ua.*, us.user_id, u.name as user_name, u.role
           FROM user_activities ua
           JOIN user_schedules us ON ua.schedule_id = us.id
           JOIN users u ON us.user_id = u.id
           WHERE us.user_id != ?
           AND FIND_IN_SET(?, ua.days_of_week)
           AND ((ua.start_time <= ? AND ua.end_time >= ?) 
                OR (ua.start_time <= ? AND ua.end_time >= ?)
                OR (ua.start_time >= ? AND ua.end_time <= ?))
           AND u.role IN ('driver', 'customer')`,
          [
            userId, 
            dayOfWeek.toString(),
            tripChain.destination_activity.start_time, tripChain.destination_activity.start_time,
            tripChain.origin_activity.end_time, tripChain.origin_activity.end_time,
            tripChain.origin_activity.end_time, tripChain.destination_activity.start_time
          ]
        );
        
        // Calculate distance and potential detour for each match
        const validMatches = potentialMatches.filter(match => {
          // Calculate distance from origin to destination
          const originToDestDistance = geolib.getDistance(
            { latitude: tripChain.origin_activity.latitude, longitude: tripChain.origin_activity.longitude },
            { latitude: tripChain.destination_activity.latitude, longitude: tripChain.destination_activity.longitude }
          ) / 1000; // Convert to km
          
          // Calculate potential detour distance
          const originToMatchDistance = geolib.getDistance(
            { latitude: tripChain.origin_activity.latitude, longitude: tripChain.origin_activity.longitude },
            { latitude: match.latitude, longitude: match.longitude }
          ) / 1000;
          
          const matchToDestDistance = geolib.getDistance(
            { latitude: match.latitude, longitude: match.longitude },
            { latitude: tripChain.destination_activity.latitude, longitude: tripChain.destination_activity.longitude }
          ) / 1000;
          
          const detourDistance = originToMatchDistance + matchToDestDistance - originToDestDistance;
          
          // Estimate detour time (assuming 30km/h average speed)
          const detourMinutes = (detourDistance / 30) * 60;
          
          // Check if detour is acceptable
          return detourDistance <= maxDistanceKm && detourMinutes <= maxDetourMinutes;
        });
        
        // Calculate score for each match
        const scoredMatches = validMatches.map(match => {
          // Calculate distance from origin to destination
          const originToDestDistance = geolib.getDistance(
            { latitude: tripChain.origin_activity.latitude, longitude: tripChain.origin_activity.longitude },
            { latitude: tripChain.destination_activity.latitude, longitude: tripChain.destination_activity.longitude }
          ) / 1000;
          
          // Calculate potential detour distance
          const originToMatchDistance = geolib.getDistance(
            { latitude: tripChain.origin_activity.latitude, longitude: tripChain.origin_activity.longitude },
            { latitude: match.latitude, longitude: match.longitude }
          ) / 1000;
          
          const matchToDestDistance = geolib.getDistance(
            { latitude: match.latitude, longitude: match.longitude },
            { latitude: tripChain.destination_activity.latitude, longitude: tripChain.destination_activity.longitude }
          ) / 1000;
          
          const detourDistance = originToMatchDistance + matchToDestDistance - originToDestDistance;
          
          // Calculate temporal compatibility
          // How well the time windows align (0-1)
          let temporalScore = 1.0;
          
          // Calculate spatial compatibility
          // Based on detour distance relative to maximum allowed
          const spatialScore = 1 - (detourDistance / maxDistanceKm);
          
          // Combined score (weighted average)
          const score = (temporalScore * 0.5) + (spatialScore * 0.5);
          
          return {
            match_user_id: match.user_id,
            user_name: match.user_name,
            user_role: match.role,
            activity_id: match.id,
            activity_type: match.activity_type,
            activity_location: match.location,
            latitude: match.latitude,
            longitude: match.longitude,
            trip_chain: tripChain,
            detour_distance: detourDistance,
            match_score: score
          };
        });
        
        allMatches = [...allMatches, ...scoredMatches];
      }
      
      // Sort by score
      allMatches.sort((a, b) => b.match_score - a.match_score);
      
      return allMatches;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a ride match using ABRA
  createABRARide: async (rideData) => {
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
        passenger_activity_id,
        driver_activity_id,
        match_score,
        detour_time
      } = rideData;
      
      // Start a transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Create the ride
        const [rideResult] = await connection.execute(
          `INSERT INTO rides (
            customer_id, driver_id, vehicle_id,
            pickup_location, pickup_latitude, pickup_longitude,
            dropoff_location, dropoff_latitude, dropoff_longitude,
            distance, duration, price, ride_type, scheduled_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activity_based', ?)`,

          [
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
            scheduled_time
          ]
        );
        
        const rideId = rideResult.insertId;
        
        // Create ABRA ride match record
        await connection.execute(
          `INSERT INTO abra_ride_matches (
            ride_id, driver_activity_id, passenger_activity_id, match_score, estimated_detour_time
          ) VALUES (?, ?, ?, ?, ?)`,

          [
            rideId,
            driver_activity_id,
            passenger_activity_id,
            match_score,
            detour_time
          ]
        );
        
        await connection.commit();
        
        return { 
          id: rideId, 
          ...rideData, 
          status: 'requested' 
        };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  },
  
  // Get ABRA ride matches for a specific ride
  getABRARideMatches: async (rideId) => {
    try {
      const [matches] = await pool.execute(
        `SELECT arm.*, 
          da.activity_type as driver_activity_type, da.location as driver_activity_location,
          pa.activity_type as passenger_activity_type, pa.location as passenger_activity_location,
          du.name as driver_name, pu.name as passenger_name
         FROM abra_ride_matches arm
         LEFT JOIN user_activities da ON arm.driver_activity_id = da.id
         LEFT JOIN user_activities pa ON arm.passenger_activity_id = pa.id
         LEFT JOIN user_schedules ds ON da.schedule_id = ds.id
         LEFT JOIN user_schedules ps ON pa.schedule_id = ps.id
         LEFT JOIN users du ON ds.user_id = du.id
         LEFT JOIN users pu ON ps.user_id = pu.id
         WHERE arm.ride_id = ?`,
        [rideId]
      );
      
      return matches;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user's upcoming ABRA rides
  getUserUpcomingABRARides: async (userId, userRole = 'customer') => {
    try {
      const roleField = userRole === 'driver' ? 'driver_id' : 'customer_id';
      
      const [rides] = await pool.execute(
        `SELECT r.*, arm.driver_activity_id, arm.passenger_activity_id, 
          arm.match_score, arm.estimated_detour_time,
          c.name as customer_name, d.name as driver_name,
          v.make, v.model, v.license_plate,
          da.activity_type as driver_activity_type, da.location as driver_activity_location,
          pa.activity_type as passenger_activity_type, pa.location as passenger_activity_location
         FROM rides r
         JOIN abra_ride_matches arm ON r.id = arm.ride_id
         JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN user_activities da ON arm.driver_activity_id = da.id
         LEFT JOIN user_activities pa ON arm.passenger_activity_id = pa.id
         WHERE r.${roleField} = ? 
         AND r.ride_type = 'activity_based'
         AND r.status IN ('requested', 'accepted', 'in_progress')
         AND r.scheduled_time >= NOW()
         ORDER BY r.scheduled_time ASC`,
        [userId]
      );
      
      return rides;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user's ABRA ride history
  getUserABRARideHistory: async (userId, userRole = 'customer', limit = 10, offset = 0) => {
    try {
      const roleField = userRole === 'driver' ? 'driver_id' : 'customer_id';
      
      const [rides] = await pool.execute(
        `SELECT r.*, arm.driver_activity_id, arm.passenger_activity_id, 
          arm.match_score, arm.estimated_detour_time,
          c.name as customer_name, d.name as driver_name,
          v.make, v.model, v.license_plate,
          da.activity_type as driver_activity_type, da.location as driver_activity_location,
          pa.activity_type as passenger_activity_type, pa.location as passenger_activity_location
         FROM rides r
         JOIN abra_ride_matches arm ON r.id = arm.ride_id
         JOIN users c ON r.customer_id = c.id
         LEFT JOIN users d ON r.driver_id = d.id
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN user_activities da ON arm.driver_activity_id = da.id
         LEFT JOIN user_activities pa ON arm.passenger_activity_id = pa.id
         WHERE r.${roleField} = ? 
         AND r.ride_type = 'activity_based'
         AND r.status IN ('completed', 'cancelled')
         ORDER BY r.updated_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );
      
      return rides;
    } catch (error) {
      throw error;
    }
  },
  
  // Update ABRA ride status
  updateABRARideStatus: async (rideId, status, updateData = {}) => {
    try {
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // Update ride status
        await connection.execute(
          'UPDATE rides SET status = ?, updated_at = NOW() WHERE id = ?',
          [status, rideId]
        );
        
        // Add additional updates if provided
        if (Object.keys(updateData).length > 0) {
          const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
          const values = [...Object.values(updateData), rideId];
          
          await connection.execute(
            `UPDATE rides SET ${fields}, updated_at = NOW() WHERE id = ?`,
            values
          );
        }
        
        // If completing the ride, record statistics
        if (status === 'completed') {
          // Get ride details
          const [rideRows] = await connection.execute(
            'SELECT * FROM rides WHERE id = ?',
            [rideId]
          );
          
          if (rideRows.length > 0) {
            const ride = rideRows[0];
            
            // Update customer stats
            await connection.execute(
              `UPDATE user_profiles 
               SET total_rides = total_rides + 1, 
                   total_distance = total_distance + ?,
                   total_amount_spent = total_amount_spent + ?
               WHERE user_id = ?`,
              [ride.distance, ride.price, ride.customer_id]
            );
            
            // Update driver stats
            if (ride.driver_id) {
              await connection.execute(
                `UPDATE user_profiles 
                 SET total_rides_given = total_rides_given + 1,
                     total_distance_driven = total_distance_driven + ?,
                     total_earnings = total_earnings + ?
                 WHERE user_id = ?`,
                [ride.distance, ride.price * 0.8, ride.driver_id]
              );
            }
          }
        }
        
        await connection.commit();
        
        return { success: true, message: `Ride status updated to ${status}` };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ABRA;