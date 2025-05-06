const TrajectoryMatcher = require('../models/trajectory.model');
const User = require('../models/user.model');
const Vehicle = require('../models/vehicle.model');

// Controller for Profile and Trajectory-Based Ridesharing Algorithm
const trajectoryController = {
  // Get user's trajectories
  getUserTrajectories: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      
      const trajectories = await User.getUserTrajectories(userId);
      
      res.status(200).json({
        success: true,
        message: 'User trajectories retrieved successfully',
        data: trajectories
      });
    } catch (error) {
      console.error('Error retrieving user trajectories:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user trajectories',
        error: error.message
      });
    }
  },
  
  // Create new trajectory
  createTrajectory: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        name,
        origin_location,
        origin_latitude,
        origin_longitude,
        destination_location,
        destination_latitude,
        destination_longitude,
        usual_departure_time,
        usual_days,
        waypoints
      } = req.body;
      
      const trajectoryData = {
        user_id: userId,
        name,
        origin_location,
        origin_latitude,
        origin_longitude,
        destination_location,
        destination_latitude,
        destination_longitude,
        usual_departure_time,
        usual_days,
        waypoints
      };
      
      const newTrajectory = await User.createTrajectory(trajectoryData);
      
      res.status(201).json({
        success: true,
        message: 'Trajectory created successfully',
        data: newTrajectory
      });
    } catch (error) {
      console.error('Error creating trajectory:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating trajectory',
        error: error.message
      });
    }
  },
  
  // Delete a trajectory
  deleteTrajectory: async (req, res) => {
    try {
      const userId = req.user.id;
      const trajectoryId = req.params.trajectoryId;
      
      const result = await User.deleteTrajectory(trajectoryId, userId);
      
      if (result.affected === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trajectory not found or you do not have permission to delete it'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Trajectory deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting trajectory:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting trajectory',
        error: error.message
      });
    }
  },
  
  // Update trajectory
  updateTrajectory: async (req, res) => {
    try {
      const userId = req.user.id;
      const trajectoryId = req.params.trajectoryId;
      const updatedData = req.body;
      
      // Ensure user owns the trajectory
      const updateResult = await User.updateTrajectory(trajectoryId, userId, updatedData);
      
      if (!updateResult || updateResult.affected === 0) {
        return res.status(404).json({
          success: false,
          message: 'Trajectory not found or you do not have permission to update it'
        });
      }
      
      // Get updated trajectory
      const updatedTrajectory = await User.getTrajectoryById(trajectoryId);
      
      res.status(200).json({
        success: true,
        message: 'Trajectory updated successfully',
        data: updatedTrajectory
      });
    } catch (error) {
      console.error('Error updating trajectory:', error);
      res.status(500).json({
        success: false, 
        message: 'Error updating trajectory',
        error: error.message
      });
    }
  },
  
  // Calculate similarity between two trajectories
  calculateTrajectorySimilarity: async (req, res) => {
    try {
      const { trajectoryId1, trajectoryId2 } = req.query;
      
      // Get both trajectories
      const [traj1] = await User.getUserTrajectories(req.user.id);
      const trajectory1 = traj1.find(t => t.id.toString() === trajectoryId1);
      
      if (!trajectory1) {
        return res.status(404).json({
          success: false,
          message: 'First trajectory not found'
        });
      }
      
      // For the second trajectory, we'll allow comparing with any user's trajectory
      const [rows] = await pool.execute(
        `SELECT t.*, 
          (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', w.id, 
              'sequence_number', w.sequence_number,
              'location', w.location,
              'latitude', w.latitude, 
              'longitude', w.longitude
            )
          ) FROM trajectory_waypoints w WHERE w.trajectory_id = t.id ORDER BY w.sequence_number) AS waypoints
        FROM user_trajectories t
        WHERE t.id = ?`,
        [trajectoryId2]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Second trajectory not found'
        });
      }
      
      // Parse waypoints JSON string to object
      const trajectory2 = {
        ...rows[0],
        waypoints: rows[0].waypoints ? JSON.parse(rows[0].waypoints) : []
      };
      
      const similarity = TrajectoryMatcher.calculateTrajectorySimilarity(trajectory1, trajectory2);
      
      res.status(200).json({
        success: true,
        message: 'Trajectory similarity calculated successfully',
        data: {
          similarity,
          trajectory1: {
            id: trajectory1.id,
            name: trajectory1.name,
            origin: trajectory1.origin_location,
            destination: trajectory1.destination_location
          },
          trajectory2: {
            id: trajectory2.id,
            name: trajectory2.name,
            origin: trajectory2.origin_location,
            destination: trajectory2.destination_location
          }
        }
      });
    } catch (error) {
      console.error('Error calculating trajectory similarity:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating trajectory similarity',
        error: error.message
      });
    }
  },
  
  // Calculate profile compatibility between two users
  calculateProfileCompatibility: async (req, res) => {
    try {
      const { userId1, userId2 } = req.query;
      
      const compatibility = await TrajectoryMatcher.calculateProfileCompatibility(userId1, userId2);
      
      res.status(200).json({
        success: true,
        message: 'Profile compatibility calculated successfully',
        data: {
          compatibility,
          userId1,
          userId2
        }
      });
    } catch (error) {
      console.error('Error calculating profile compatibility:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating profile compatibility',
        error: error.message
      });
    }
  },
  
  // Find trajectory matches for a user
  findTrajectoryMatches: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const { trajectoryId, minSimilarity } = req.query;
      
      const matches = await TrajectoryMatcher.findTrajectoryMatches(
        userId,
        trajectoryId || null,
        minSimilarity ? parseFloat(minSimilarity) : 0.6
      );
      
      res.status(200).json({
        success: true,
        message: 'Trajectory matches found successfully',
        data: matches
      });
    } catch (error) {
      console.error('Error finding trajectory matches:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding trajectory matches',
        error: error.message
      });
    }
  },
  
  // Create a trajectory-based ride
  createTrajectoryRide: async (req, res) => {
    try {
      const customerId = req.user.id;
      const {
        driverId,
        vehicleId,
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        dropoffLocation,
        dropoffLatitude,
        dropoffLongitude,
        distance,
        duration,
        scheduledTime,
        passengerTrajectoryId,
        driverTrajectoryId,
        trajectorySimilarity,
        profileCompatibility,
        combinedScore
      } = req.body;
      
      // Calculate price based on distance and duration
      const baseFare = 2.5;
      const pricePerKm = 0.5;
      const pricePerMinute = 0.15;
      
      const price = baseFare + (distance * pricePerKm) + (duration * pricePerMinute);
      
      // Verify vehicle belongs to driver
      if (vehicleId) {
        const vehicle = await Vehicle.getVehicleById(vehicleId);
        if (!vehicle || vehicle.driver_id !== driverId) {
          return res.status(400).json({
            success: false,
            message: 'Invalid vehicle selection'
          });
        }
      }
      
      // Create the ride
      const ride = await TrajectoryMatcher.createTrajectoryBasedRide({
        customer_id: customerId,
        driver_id: driverId,
        vehicle_id: vehicleId,
        pickup_location: pickupLocation,
        pickup_latitude: pickupLatitude,
        pickup_longitude: pickupLongitude,
        dropoff_location: dropoffLocation,
        dropoff_latitude: dropoffLatitude,
        dropoff_longitude: dropoffLongitude,
        distance,
        duration,
        price: parseFloat(price.toFixed(2)),
        scheduled_time: scheduledTime,
        passenger_trajectory_id: passengerTrajectoryId,
        driver_trajectory_id: driverTrajectoryId,
        trajectory_similarity: trajectorySimilarity,
        profile_compatibility: profileCompatibility,
        combined_score: combinedScore
      });
      
      res.status(201).json({
        success: true,
        message: 'Trajectory-based ride created successfully',
        data: ride
      });
    } catch (error) {
      console.error('Error creating trajectory-based ride:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating trajectory-based ride',
        error: error.message
      });
    }
  },
  
  // Get user's upcoming trajectory rides
  getUpcomingTrajectoryRides: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const rides = await TrajectoryMatcher.getUserUpcomingTrajectoryRides(userId, userRole);
      
      res.status(200).json({
        success: true,
        message: 'Upcoming trajectory rides retrieved successfully',
        data: rides
      });
    } catch (error) {
      console.error('Error retrieving upcoming trajectory rides:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving upcoming trajectory rides',
        error: error.message
      });
    }
  },
  
  // Get user's trajectory ride history
  getTrajectoryRideHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { limit = 10, offset = 0 } = req.query;
      
      const rides = await TrajectoryMatcher.getUserTrajectoryRideHistory(
        userId, 
        userRole,
        parseInt(limit, 10),
        parseInt(offset, 10)
      );
      
      res.status(200).json({
        success: true,
        message: 'Trajectory ride history retrieved successfully',
        data: rides
      });
    } catch (error) {
      console.error('Error retrieving trajectory ride history:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving trajectory ride history',
        error: error.message
      });
    }
  },
  
  // Update trajectory ride status
  updateTrajectoryRideStatus: async (req, res) => {
    try {
      const { rideId } = req.params;
      const { status, additionalData = {} } = req.body;
      
      // Check valid status
      const validStatuses = ['accepted', 'rejected', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid ride status'
        });
      }
      
      const result = await TrajectoryMatcher.updateTrajectoryRideStatus(rideId, status, additionalData);
      
      res.status(200).json({
        success: true,
        message: `Ride status updated to ${status} successfully`,
        data: result
      });
    } catch (error) {
      console.error('Error updating trajectory ride status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating trajectory ride status',
        error: error.message
      });
    }
  },
  
  // Get trajectory match details for a ride
  getTrajectoryMatchDetails: async (req, res) => {
    try {
      const { rideId } = req.params;
      
      const matchDetails = await TrajectoryMatcher.getTrajectoryMatchDetails(rideId);
      
      if (!matchDetails) {
        return res.status(404).json({
          success: false,
          message: 'Trajectory match details not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Trajectory match details retrieved successfully',
        data: matchDetails
      });
    } catch (error) {
      console.error('Error retrieving trajectory match details:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving trajectory match details',
        error: error.message
      });
    }
  },
  
  // Calculate similarity between trajectories (for testing)
  calculateSimilarity: async (req, res) => {
    try {
      const { trajectory1, trajectory2 } = req.body;
      
      if (!trajectory1 || !trajectory2) {
        return res.status(400).json({
          success: false,
          message: 'Two trajectories are required'
        });
      }
      
      const similarity = TrajectoryMatcher.calculateTrajectorySimilarity(trajectory1, trajectory2);
      
      res.status(200).json({
        success: true,
        message: 'Similarity calculated successfully',
        data: { similarity }
      });
    } catch (error) {
      console.error('Error calculating trajectory similarity:', error);
      res.status(500).json({
        success: false,
        message: 'Error calculating trajectory similarity',
        error: error.message
      });
    }
  }
};

module.exports = trajectoryController;