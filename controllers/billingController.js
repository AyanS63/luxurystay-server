import Billing from '../models/Billing.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';
import pusher from "../utils/pusher.js";

export const createBill = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    // Check if bill already exists
    const existingBill = await Billing.findOne({ booking: bookingId });
    if (existingBill) {
      return res.status(400).json({ message: 'Bill already exists for this booking' });
    }

    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const newBill = new Billing({
      booking: bookingId,
      items: [{
        description: 'Room Charge',
        amount: booking.totalAmount,
        date: new Date()
      }],
      totalAmount: booking.totalAmount,
      status: 'Pending'
    });

    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllBills = async (req, res) => {
  try {
    const bills = await Billing.find()
      .populate({
        path: 'booking',
        populate: { path: 'user', select: 'username email' }
      })
      .sort({ createdAt: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getBillByBooking = async (req, res) => {
  try {
    const bill = await Billing.findOne({ booking: req.params.bookingId })
      .populate('booking');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addItemToBill = async (req, res) => {
  try {
    const { description, amount } = req.body;
    const bill = await Billing.findById(req.params.id);
    
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.items.push({ description, amount, date: new Date() });
    bill.totalAmount += Number(amount);
    
    // Update status if it was paid but now new charges added (optional, but good practice)
    if (bill.status === 'Paid') bill.status = 'Partial';

    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const processPayment = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const bill = await Billing.findById(req.params.id);
    
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.paidAmount += Number(amount);
    bill.paymentMethod = paymentMethod;

    if (bill.paidAmount >= bill.totalAmount) {
      bill.status = 'Paid';
    } else {
      bill.status = 'Partial';
    }

    await bill.save();
    await bill.save();

    // Real-time notification
    try {
        await pusher.trigger('private-staff', 'payment_received', {
            message: `Payment Received: $${amount}`,
            bill
        });
    } catch(e) { console.error(e); }

    // Save Notification
    await new Notification({
        type: 'payment_received',
        message: `Payment Received: $${amount}`,
        data: { billId: bill._id }
    }).save();

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
