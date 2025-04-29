/**
 * Socket.io configuration for real-time communication in the ride-sharing app
 */

// Map to store active socket connections with their user IDs
const activeUsers = new Map();
// Map to store active drivers with their location information
const activeDrivers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user authentication
    socket.on('authenticate', (userData) => {
      const { userId, role } = userData;
      
      if (userId) {
        // Store socket ID with user ID for private communications
        activeUsers.set(userId.toString(), socket.id);
        
        // Join role-specific room for broadcasting
        socket.join(role);
        
        console.log(`User ${userId} (${role}) authenticated with socket ${socket.id}`);
        
        // Send active status to client
        socket.emit('authenticated', { success: true });
      }
    });

    // Handle driver location updates
    socket.on('updateDriverLocation', (data) => {
      const { driverId, location } = data;
      
      if (driverId && location) {
        // Store driver location
        activeDrivers.set(driverId.toString(), {
          socketId: socket.id,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy || null,
            timestamp: new Date()
          }
        });
        
        // Broadcast to active rides this driver is handling
        if (data.rideId) {
          io.to(`ride:${data.rideId}`).emit('driverLocationUpdated', {
            rideId: data.rideId,
            driverId,
            location
          });
        }
      }
    });

    // Handle new ride request
    socket.on('newRideRequest', (rideData) => {
      // Broadcast to all drivers
      socket.broadcast.to('driver').emit('rideRequested', rideData);
      
      console.log(`New ride requested by user ${rideData.customerId} broadcasted to drivers`);
    });

    // Handle ride acceptance
    socket.on('acceptRide', (data) => {
      const { rideId, driverId, customerId, estimatedArrival } = data;
      
      // Create ride-specific room
      socket.join(`ride:${rideId}`);
      
      // Notify customer
      const customerSocketId = activeUsers.get(customerId.toString());
      if (customerSocketId) {
        io.to(customerSocketId).emit('rideAccepted', {
          rideId,
          driverId,
          estimatedArrival,
          driverInfo: data.driverInfo || null
        });
        
        // Also add customer to the ride-specific room
        const customerSocket = io.sockets.sockets.get(customerSocketId);
        if (customerSocket) {
          customerSocket.join(`ride:${rideId}`);
        }
      }
    });

    // Handle ride status updates
    socket.on('updateRideStatus', (data) => {
      const { rideId, status } = data;
      
      // Broadcast to all in ride room
      io.to(`ride:${rideId}`).emit('rideStatusUpdated', {
        rideId,
        status,
        timestamp: new Date()
      });
    });

    // Handle ride cancellation
    socket.on('cancelRide', (data) => {
      const { rideId, userId, role } = data;
      
      // Broadcast cancellation to all in ride room
      io.to(`ride:${rideId}`).emit('rideCancelled', {
        rideId,
        cancelledBy: {
          userId,
          role
        },
        timestamp: new Date()
      });
      
      // Clean up ride room
      io.in(`ride:${rideId}`).socketsLeave(`ride:${rideId}`);
    });

    // Handle ride completion
    socket.on('completeRide', (data) => {
      const { rideId } = data;
      
      // Broadcast completion to all in ride room
      io.to(`ride:${rideId}`).emit('rideCompleted', {
        rideId,
        timestamp: new Date()
      });
      
      // Clean up ride room
      io.in(`ride:${rideId}`).socketsLeave(`ride:${rideId}`);
    });

    // Handle chat messages
    socket.on('sendMessage', (data) => {
      const { rideId, sender, message } = data;
      
      // Broadcast message to everyone in the ride room
      io.to(`ride:${rideId}`).emit('newMessage', {
        rideId,
        sender,
        message,
        timestamp: new Date()
      });
    });

    // Handle nearby drivers request
    socket.on('getNearbyDrivers', (data) => {
      const { latitude, longitude, radius } = data;
      
      // Filter active drivers by location (simplified version)
      const nearbyDrivers = [];
      
      activeDrivers.forEach((driverData, driverId) => {
        const driverLocation = driverData.location;
        
        // Simple distance calculation (would use proper geo calculation in production)
        const distance = Math.sqrt(
          Math.pow(driverLocation.latitude - latitude, 2) + 
          Math.pow(driverLocation.longitude - longitude, 2)
        ) * 111; // Rough conversion to km
        
        if (distance <= (radius || 5)) {
          nearbyDrivers.push({
            driverId,
            location: driverLocation,
            distance: Math.round(distance * 10) / 10
          });
        }
      });
      
      // Send results back to requester
      socket.emit('nearbyDriversResult', {
        drivers: nearbyDrivers,
        count: nearbyDrivers.length
      });
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove user from active users
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      
      // Remove driver from active drivers
      for (const [driverId, driverData] of activeDrivers.entries()) {
        if (driverData.socketId === socket.id) {
          activeDrivers.delete(driverId);
          console.log(`Driver ${driverId} disconnected`);
          break;
        }
      }
    });
  });

  // Utility function to get a user's socket ID by their user ID
  const getUserSocketId = (userId) => {
    return activeUsers.get(userId.toString());
  };

  // Utility function to get driver information by their driver ID
  const getActiveDriver = (driverId) => {
    return activeDrivers.get(driverId.toString());
  };

  // Utility function to send a notification to a specific user
  const notifyUser = (userId, event, data) => {
    const socketId = getUserSocketId(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  };

  // Utility function to broadcast to all drivers
  const broadcastToDrivers = (event, data) => {
    io.to('driver').emit(event, data);
  };

  // Return utility functions for use in controllers
  return {
    getUserSocketId,
    getActiveDriver,
    notifyUser,
    broadcastToDrivers
  };
};