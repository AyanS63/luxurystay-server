import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, for logged-in users
  eventType: { 
    type: String, 
    enum: ['Wedding', 'Corporate', 'Social', 'Other'],
    required: true 
  },
  date: { type: Date, required: true },
  guests: { type: Number, required: true },
  requirements: { type: String },
  contactInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  cost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', EventSchema);
