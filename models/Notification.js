import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['booking', 'event', 'inquiry', 'check_in', 'check_out', 'payment_received', 'payment_reversed']
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object, // Store related ID or small details
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto delete after 30 days
  }
});

export default mongoose.model('Notification', notificationSchema);
