import mongoose from 'mongoose';

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Replied'], 
    default: 'Pending' 
  },
  reply: { type: String },
  repliedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Inquiry', InquirySchema);
