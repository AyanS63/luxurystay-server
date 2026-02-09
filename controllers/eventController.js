import Event from '../models/Event.js';
import Billing from '../models/Billing.js';
import Notification from '../models/Notification.js';
import stripe from '../utils/stripe.js';
import pusher from "../utils/pusher.js";
import sendEmail from "../utils/sendEmail.js";
import { eventInquiryReceivedTemplate, eventStatusUpdateTemplate } from "../utils/emailTemplates.js";

export const createEventPaymentIntent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (!event.cost || event.cost <= 0) {
      return res.status(400).json({ message: 'Event has no cost assigned' });
    }

    // Check if already paid logic could go here based on billing

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(event.cost * 100), // cents
      currency: 'usd',
      metadata: {
        eventId: event._id.toString(),
        userId: req.user.id
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: event.cost
    });
  } catch (error) {
    console.error('Create Event Payment Intent Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const confirmEventPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const eventId = req.params.id;

    if (!paymentIntentId) {
        return res.status(400).json({ message: 'Payment Intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: 'Payment not successful' });
    }

    // Update Billing
    let billing = await Billing.findOne({ event: eventId });
    if (!billing) {
        // Should have been created by invoice, but if not create now
        billing = new Billing({
            event: eventId,
            totalAmount: paymentIntent.amount / 100,
            status: 'Pending',
            items: [{ description: 'Event Payment', amount: paymentIntent.amount / 100, date: new Date() }]
        });
    }

    billing.status = 'Paid';
    billing.paidAmount = billing.totalAmount;
    billing.paymentMethod = 'Stripe';
    billing.stripePaymentIntentId = paymentIntent.id; // Save Payment Intent ID
    billing.paymentDate = new Date();
    await billing.save();

    // Update Event Status
    const event = await Event.findById(eventId);
    if (event) {
        event.status = 'Confirmed';
        await event.save();
    }
    
    // Notification
    // Notification
    // event variable already exists and is updated above
    // Notification
    try {
        await pusher.trigger('private-staff', 'payment_received', {
            message: `Event Payment Received: ${event.eventType} - $${billing.totalAmount}`,
            data: { eventId, billingId: billing._id }
        });
    } catch (pushError) {
        console.error('Pusher Error:', pushError);
    }
    
    await new Notification({
        type: 'payment_received',
        message: `Event Payment Received: ${event.eventType} - $${billing.totalAmount}`,
        data: { eventId, billingId: billing._id }
    }).save();

    res.json({ message: 'Payment confirmed', billing });
  } catch (error) {
    console.error('Confirm Event Payment Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createEvent = async (req, res) => {
  try {
    const { eventType, date, guests, requirements, contactInfo, cost, discount } = req.body;

    // Check for existing active inquiry (Pending or Confirmed)
    const existingEvent = await Event.findOne({
      'contactInfo.email': contactInfo.email,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (existingEvent) {
      return res.status(400).json({ 
        message: 'You already have an active event inquiry. Please wait for it to be completed or cancelled.' 
      });
    }

    const newEvent = new Event({
      user: req.user ? req.user.id : undefined,
      eventType,
      date,
      guests,
      requirements,
      contactInfo,
      cost,
      discount: discount || 0
    });

    await newEvent.save();

    // Real-time notification
    try {
        await pusher.trigger('private-staff', 'new_event', {
            message: `New event inquiry: ${eventType} on ${new Date(date).toLocaleDateString()}`,
            event: newEvent
        });
    } catch(e) { console.error(e); }
    
    // Save Notification
    await new Notification({
        type: 'event',
        message: `New event inquiry: ${eventType} on ${new Date(date).toLocaleDateString()}`,
        data: { eventId: newEvent._id }
    }).save();

    // Send Inquiry Received Email
    if (contactInfo && contactInfo.email) {
        try {
            const html = eventInquiryReceivedTemplate(newEvent);
            await sendEmail({
                email: contactInfo.email,
                subject: 'We Received Your Event Inquiry - LuxuryStay',
                html: html
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }
    }

    res.status(201).json({ message: 'Event inquiry received successfully', event: newEvent });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getEvents = async (req, res) => {
    try {
        let query = {};
        // If not admin/staff, only show own events
        if (req.user && !['admin', 'manager', 'receptionist', 'hotel_staff'].includes(req.user.role)) {
            query.user = req.user.id;
        }

        const events = await Event.find(query).sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Access Control: Allow if staff OR if event belongs to user
        const isStaff = ['admin', 'manager', 'receptionist', 'hotel_staff'].includes(req.user.role);
        if (!isStaff && (!event.user || event.user.toString() !== req.user.id)) {
             return res.status(403).json({ message: 'Access denied' });
        }

        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateEventStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Find event first to check current state
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Handle Refunds if Cancelling/Rejecting a paid event
    if ((status === 'Cancelled' || status === 'Rejected' || status === 'Decline') && event.status !== status) {
        const billing = await Billing.findOne({ event: event._id, status: 'Paid' });
        
        if (billing && billing.paymentMethod === 'Stripe') {
             try {
                 let refundId;
                 
                 // 1. Try to refund using stored PaymentIntent ID (Preferred)
                 if (billing.stripePaymentIntentId) {
                     const refund = await stripe.refunds.create({
                         payment_intent: billing.stripePaymentIntentId
                     });
                     refundId = refund.id;
                 } 
                 // 2. Fallback: Search by metadata (Legacy support)
                 else {
                     const paymentIntents = await stripe.paymentIntents.search({
                       query: `metadata['eventId']:'${event._id}' AND status:'succeeded'`,
                     });
                     
                     if (paymentIntents.data.length > 0) {
                         const pi = paymentIntents.data[0];
                         const refund = await stripe.refunds.create({ payment_intent: pi.id });
                         refundId = refund.id;
                     }
                 }

                 if (refundId) {
                     billing.status = 'Refunded';
                     billing.paidAmount = 0; 
                     await billing.save();
                 }
             } catch (stripeError) {
                 if (stripeError.code === 'charge_already_refunded') {

                     billing.status = 'Refunded';
                     billing.paidAmount = 0; 
                     await billing.save();
                 } else {
                    console.error('Stripe Refund Error:', stripeError);
                 }
                 // Continue with status update but maybe warn?
             }
        }
    }

    event.status = status;
    await event.save();

    // Send Status Update Email
    if (event.contactInfo && event.contactInfo.email) {
        try {
            const html = eventStatusUpdateTemplate(event, status);
            await sendEmail({
                email: event.contactInfo.email,
                subject: `Event Inquiry Update: ${status} - LuxuryStay`,
                html: html
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
        }
    }

    res.json({ message: 'Event status updated', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createEventInvoice = async (req, res) => {
  try {
    const { amount, markAsPaid, discount } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Update event cost and discount
    event.cost = amount;
    if (discount !== undefined) event.discount = discount;
    await event.save();

    const billingStatus = markAsPaid ? 'Paid' : 'Pending';
    const paidAmt = markAsPaid ? amount : 0;

    // Check if bill exists
    const existingBill = await Billing.findOne({ event: eventId });
    if (existingBill) {
      existingBill.totalAmount = amount;
      existingBill.paidAmount = paidAmt; // Update paid amount
      existingBill.status = billingStatus;
      existingBill.items = [{
        description: `Event Charge: ${event.eventType}`,
        amount: amount,
        date: new Date()
      }];
      await existingBill.save();
      return res.json(existingBill);
    }

    const newBill = new Billing({
      event: eventId,
      items: [{
        description: `Event Charge: ${event.eventType}`,
        amount: amount,
        date: new Date()
      }],
      totalAmount: amount,
      paidAmount: paidAmt,
      status: billingStatus
    });

    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
