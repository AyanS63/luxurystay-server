import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

export const searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [], rooms: [], bookings: [] });

    // Case-insensitive regex
    const regex = new RegExp(q, 'i');

    const [users, rooms, bookings] = await Promise.all([
      User.find({
        $or: [{ username: regex }, { email: regex }]
      }).select('username email role').limit(5),
      
      Room.find({
        $or: [{ roomNumber: regex }, { type: regex }, { status: regex }]
      }).select('roomNumber type status pricePerNight').limit(5),
      
      Booking.find({})
      .populate('user', 'username')
      .populate('room', 'roomNumber')
      // Improve booking search: filtering populated fields is tricky in simple find, 
      // so we might search by ID or strict date match, or fetch recent and filter in memory?
      // For scalability, we should use aggregation but for now let's just find by exact ID match 
      // or if possible simple fields. Since 'user' and 'room' are refs, we can't regex them easily here without aggregation.
      // Let's stick to searching by simple fields or ID if it looks like an ID.
    ]);
    
    // Simplification: We'll return results found directly. 
    // For more advanced search (guests in bookings), we would need aggregate lookups.
    // Let's add basic aggregation for bookings if q matches a guest name.
    
    // Re-doing booking search with aggregation to search populated fields
    const bookingResults = await Booking.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomDetails'
        }
      },
      {
        $match: {
          $or: [
            { 'userDetails.username': regex },
            { 'userDetails.email': regex },
            { 'roomDetails.roomNumber': regex },
            { status: regex }
          ]
        }
      },
      { $limit: 5 },
      { 
        $project: {
          _id: 1,
          status: 1,
          checkInDate: 1,
          checkOutDate: 1,
          'userDetails.username': 1,
          'roomDetails.roomNumber': 1
        }
      }
    ]);

    res.json({
      users,
      rooms,
      bookings: bookingResults
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
