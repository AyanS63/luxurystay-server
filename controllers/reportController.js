import Billing from '../models/Billing.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);

    // 1. Basic Counts
    const users = await User.countDocuments();
    const rooms = await Room.countDocuments();
    const bookings = await Booking.countDocuments();

    // 2. Revenue (Aggregated from Paid Billing)
    const revenueAgg = await Billing.aggregate([
      { $match: { status: { $in: ['Paid', 'Partial'] } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } }
    ]);
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 3. Room Statuses
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const occupiedRooms = await Room.countDocuments({ status: 'Occupied' });
    const cleaningRooms = await Room.countDocuments({ status: 'Cleaning' });
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });

    // 4. Daily Operations (Check-ins/outs)
    // Find bookings with checkIn or checkOut date matching today
    // Note: Stored dates usually have times, so range query is safest or exact date match if normalized
    // Assuming checkIn/checkOut are Date objects in Booking model
    
    const todayCheckIns = await Booking.countDocuments({
      checkInDate: { $gte: today, $lt: nextDay },
      status: { $in: ['Confirmed', 'CheckedIn'] }
    });

    const todayCheckOuts = await Booking.countDocuments({
      checkOutDate: { $gte: today, $lt: nextDay },
      status: { $in: ['CheckedIn', 'CheckedOut'] }
    });

    res.json({
      users,
      rooms,
      bookings,
      revenue,
      todayCheckIns,
      todayCheckOuts,
      availableRooms,
      occupiedRooms,
      cleaningRooms,
      maintenanceRooms
    });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};
