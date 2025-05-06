const ABRA = require('../models/abra.model');
const User = require('../models/user.model');

// Controller for Activity-Based Ridesharing Algorithm
const abraController = {
  // Get user's activity schedules
  getUserSchedules: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      
      const schedules = await User.getUserSchedules(userId);
      
      res.status(200).json({
        success: true,
        message: 'User schedules retrieved successfully',
        data: schedules
      });
    } catch (error) {
      console.error('Error retrieving user schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving user schedules',
        error: error.message
      });
    }
  },
  
  // Create new schedule
  createSchedule: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name } = req.body;
      
      const scheduleData = {
        user_id: userId,
        name
      };
      
      const newSchedule = await User.createSchedule(scheduleData);
      
      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: newSchedule
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating schedule',
        error: error.message
      });
    }
  },
  
  // Get activities for a schedule
  getScheduleActivities: async (req, res) => {
    try {
      const { scheduleId } = req.params;
      
      const activities = await User.getScheduleActivities(scheduleId);
      
      res.status(200).json({
        success: true,
        message: 'Schedule activities retrieved successfully',
        data: activities
      });
    } catch (error) {
      console.error('Error retrieving schedule activities:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving schedule activities',
        error: error.message
      });
    }
  },
  
  // Create a new activity
  createActivity: async (req, res) => {
    try {
      const {
        schedule_id,
        activity_type,
        location,
        latitude,
        longitude,
        start_time,
        end_time,
        days_of_week,
        is_flexible,
        flexibility_radius,
        max_detour_time,
        alternative_locations
      } = req.body;
      
      const activityData = {
        schedule_id,
        activity_type,
        location,
        latitude,
        longitude,
        start_time,
        end_time,
        days_of_week,
        is_flexible,
        flexibility_radius,
        max_detour_time,
        alternative_locations
      };
      
      const newActivity = await User.createActivity(activityData);
      
      res.status(201).json({
        success: true,
        message: 'Activity created successfully',
        data: newActivity
      });
    } catch (error) {
      console.error('Error creating activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating activity',
        error: error.message
      });
    }
  },
  
  // Delete an activity
  deleteActivity: async (req, res) => {
    try {
      const { activityId } = req.params;
      
      const result = await User.deleteActivity(activityId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Activity not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Activity deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting activity:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting activity',
        error: error.message
      });
    }
  },
  
  // Generate trip chains for a user
  generateTripChains: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const { date } = req.query;
      
      // Use current date if not provided
      const tripDate = date ? new Date(date) : new Date();
      
      const tripChains = await ABRA.generateTripChains(userId, tripDate);
      
      res.status(200).json({
        success: true,
        message: 'Trip chains generated successfully',
        data: tripChains
      });
    } catch (error) {
      console.error('Error generating trip chains:', error);
      res.status(500).json({
        success: false,
        message: 'Error generating trip chains',
        error: error.message
      });
    }
  },
  
  // Find alternative locations for an activity
  findAlternativeLocations: async (req, res) => {
    try {
      const { activityId } = req.params;
      const { maxRadius } = req.query;
      
      const alternativeLocations = await ABRA.findAlternativeLocations(
        activityId,
        maxRadius ? parseInt(maxRadius) : undefined
      );
      
      res.status(200).json({
        success: true,
        message: 'Alternative locations found successfully',
        data: alternativeLocations
      });
    } catch (error) {
      console.error('Error finding alternative locations:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding alternative locations',
        error: error.message
      });
    }
  },
  
  // Find activity-based matches
  findActivityBasedMatches: async (req, res) => {
    try {
      const userId = req.params.userId || req.user.id;
      const { date, maxDetourMinutes, maxDistanceKm } = req.query;
      
      // Use current date if not provided
      const matchDate = date ? new Date(date) : new Date();
      
      const matches = await ABRA.findActivityBasedMatches(
        userId,
        matchDate,
        maxDetourMinutes ? parseInt(maxDetourMinutes) : undefined,
        maxDistanceKm ? parseFloat(maxDistanceKm) : undefined
      );
      
      res.status(200).json({
        success: true,
        message: 'Activity-based matches found successfully',
        data: matches
      });
    } catch (error) {
      console.error('Error finding activity-based matches:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding activity-based matches',
        error: error.message
      });
    }
  },
  
  // Create an activity-based ride
  createABRARide: async (req, res) => {
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
      } = req.body;
      
      const rideData = {
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
      };
      
      const newRide = await ABRA.createABRARide(rideData);
      
      res.status(201).json({
        success: true,
        message: 'Activity-based ride created successfully',
        data: newRide
      });
    } catch (error) {
      console.error('Error creating activity-based ride:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating activity-based ride',
        error: error.message
      });
    }
  },
  
  // Get ABRA ride match details
  getABRARideMatches: async (req, res) => {
    try {
      const { rideId } = req.params;
      
      const matches = await ABRA.getABRARideMatches(rideId);
      
      res.status(200).json({
        success: true,
        message: 'ABRA ride matches retrieved successfully',
        data: matches
      });
    } catch (error) {
      console.error('Error retrieving ABRA ride matches:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving ABRA ride matches',
        error: error.message
      });
    }
  }
};

module.exports = abraController;