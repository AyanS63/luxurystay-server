import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  paymentIntentId: { type: String }, // For refunds
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'Rejected'],
    default: 'Pending'
  },
  guests: { type: Number, default: 1 },
  extras: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  specialRequests: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
BookingSchema.index({ user: 1 });
BookingSchema.index({ room: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ checkInDate: 1 });
BookingSchema.index({ checkOutDate: 1 });

export default mongoose.model('Booking', BookingSchema);
