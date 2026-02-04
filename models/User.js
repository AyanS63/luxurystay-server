import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'receptionist', 'housekeeping', 'guest', 'hotel_staff'], 
    default: 'guest' 
  },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  googleId: String,
  picture: String
});

export default mongoose.model('User', UserSchema);
