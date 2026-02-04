import mongoose from 'mongoose';

const BillingSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  items: [{
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['Pending', 'Partial', 'Paid', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Billing', BillingSchema);
