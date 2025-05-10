const { Booking, Member, Group, User, Payment, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new booking for a user in a group
 * @param {Object} bookingData - Booking data
 * @param {number} passengerUserId - User ID of the passenger
 * @returns {Object} Created booking
 */
const createBooking = async (bookingData, passengerUserId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Kiểm tra nhóm có tồn tại không
    const group = await Group.findByPk(bookingData.group_id, {
      include: [
        {
          model: Member
        }
      ],
      transaction
    });
    
    if (!group) {
      await transaction.rollback();
      throw new Error('Group not found');
    }
    
    // Kiểm tra nhóm có mở cho đặt chỗ không
    if (group.status !== 0) {
      await transaction.rollback();
      throw new Error('Group is not open for bookings');
    }
    
    // Kiểm tra có còn chỗ trống trong nhóm không
    if (group.Members.length >= group.limit_passenger) {
      await transaction.rollback();
      throw new Error('Group is full');
    }
    
    // Kiểm tra người dùng đã là thành viên của nhóm này chưa
    const existingMembership = group.Members.find(m => m.user_id === passengerUserId);
    if (existingMembership) {
      await transaction.rollback();
      throw new Error('User is already a member of this group');
    }
    
    // Xác minh phương thức thanh toán nếu được cung cấp
    if (bookingData.payment_id) {
      const payment = await Payment.findOne({
        where: {
          id: bookingData.payment_id,
          user_id: passengerUserId
        },
        transaction
      });
      
      if (!payment) {
        await transaction.rollback();
        throw new Error('Invalid payment method');
      }
    }
    
    // Tạo booking với timestamp hiện tại
    const booking = await Booking.create({
      user_id: passengerUserId,
      group_id: bookingData.group_id,
      payment_id: bookingData.payment_id,
      status: 0, // Pending
      booking_timestamp: Date.now(),
      pickup_location_name: bookingData.pickup_location_name,
      pickup_lat: bookingData.pickup_lat,
      pickup_lon: bookingData.pickup_lon,
      dropoff_location_name: bookingData.dropoff_location_name,
      dropoff_lat: bookingData.dropoff_lat,
      dropoff_lon: bookingData.dropoff_lon,
      fare: bookingData.fare
    }, { transaction });
    
    // Tạo bản ghi thành viên cho hành khách
    const memberUid = uuidv4();
    await Member.create({
      uid: memberUid,
      user_id: passengerUserId,
      group_id: bookingData.group_id,
      role: 'passenger',
      join_timestamp: Date.now()
    }, { transaction });
    
    // Cập nhật trạng thái nhóm nếu nó trở nên đầy sau booking này
    if (group.Members.length + 1 === group.limit_passenger) {
      await group.update({
        status: 1 // Full
      }, { transaction });
    }
    
    await transaction.commit();
    
    // Lấy booking đầy đủ với thông tin người dùng và nhóm
    return await getBookingById(booking.id);
  } catch (error) {
    await transaction.rollback();
    console.error('Error in createBooking:', error);
    throw error;
  }
};

/**
 * Get booking by ID
 * @param {number} bookingId - Booking ID
 * @returns {Object} Booking with user, group and payment details
 */
const getBookingById = async (bookingId) => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'url', 'email', 'phone']
        },
        {
          model: Group,
          include: [
            {
              model: Member,
              include: [
                {
                  model: User,
                  attributes: ['id', 'name', 'url', 'email', 'phone']
                }
              ]
            }
          ]
        },
        {
          model: Payment,
          attributes: ['id', 'card_number', 'card_name', 'type']
        }
      ]
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    return booking;
  } catch (error) {
    console.error('Error in getBookingById:', error);
    throw error;
  }
};

/**
 * Update booking status
 * @param {number} bookingId - Booking ID
 * @param {number} userId - User ID (for authorization)
 * @param {number} status - New status
 * @returns {Object} Updated booking
 */
const updateBookingStatus = async (bookingId, userId, status) => {
  try {
    const booking = await Booking.findByPk(bookingId, {
      include: [
        {
          model: Group,
          include: [
            {
              model: Member
            }
          ]
        }
      ]
    });
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Check authorization:
    // If passenger (own booking), they can only cancel (status 2)
    // If driver (group owner), they can confirm (status 1), cancel (status 3), or complete (status 4)
    const isOwnBooking = booking.user_id === userId;
    const isDriver = booking.Group.Members.some(m => m.user_id === userId && m.role === 'driver');
    
    if (isOwnBooking && status !== 2) {
      throw new Error('Passenger can only cancel their booking');
    }
    
    if (!isOwnBooking && !isDriver) {
      throw new Error('Not authorized to update this booking');
    }
    
    // Update booking status
    await booking.update({ status });
    
    // If the booking is cancelled, handle group status updates
    if (status === 2 || status === 3) {
      // Check if the group was full before
      if (booking.Group.status === 1) {
        await booking.Group.update({ status: 0 }); // Set back to Open
      }
      
      // Remove the passenger from group members
      await Member.destroy({
        where: {
          group_id: booking.group_id,
          user_id: booking.user_id,
          role: 'passenger'
        }
      });
    }
    
    // Return the updated booking
    return await getBookingById(bookingId);
  } catch (error) {
    throw error;
  }
};

/**
 * Get all bookings for a user
 * @param {number} userId - User ID
 * @returns {Array} List of bookings
 */
const getUserBookings = async (userId) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Group
        },
        {
          model: Payment,
          attributes: ['id', 'card_number', 'card_name', 'type']
        }
      ],
      order: [['booking_timestamp', 'DESC']]
    });
    
    return bookings;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all bookings for a group
 * @param {number} groupId - Group ID
 * @param {number} userId - User ID (must be the driver)
 * @returns {Array} List of bookings
 */
const getBookingsByGroupId = async (groupId, userId) => {
  try {
    // Check if user is the driver of this group
    const isMemberDriver = await Member.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        role: 'driver'
      }
    });
    
    if (!isMemberDriver) {
      throw new Error('Not authorized to view these bookings');
    }
    
    const bookings = await Booking.findAll({
      where: { group_id: groupId },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'url', 'email', 'phone']
        },
        {
          model: Payment,
          attributes: ['id', 'card_number', 'card_name', 'type']
        }
      ],
      order: [['booking_timestamp', 'DESC']]
    });
    
    return bookings;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBookingStatus,
  getUserBookings,
  getBookingsByGroupId
};