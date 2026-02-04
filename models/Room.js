import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Penthouse']
  },
  pricePerNight: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Cleaning', 'Maintenance'],
    default: 'Available'
  },
  description: { type: String },
  amenities: [{ type: String }], // e.g., ["TV", "WiFi", "Mini Bar"]
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Indexes for searching and filtering
RoomSchema.index({ status: 1 });
RoomSchema.index({ type: 1 });
RoomSchema.index({ pricePerNight: 1 });
RoomSchema.index({ roomNumber: 1 });

export default mongoose.model('Room', RoomSchema);
