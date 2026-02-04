import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Billing from "../models/Billing.js";
import stripe from "../utils/stripe.js";
import Notification from "../models/Notification.js";
import pusher from "../utils/pusher.js";

export const createPaymentIntent = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, extras = [] } = req.body;

    const roomDetails = await Room.findById(room);
    if (!roomDetails)
      return res.status(404).json({ message: "Room not found" });

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return res.status(400).json({ message: "Invalid dates" });

    // Check availability (same logic as createBooking)
    const existingUserBooking = await Booking.findOne({
      user: req.user.id,
      room: room,
      status: { $in: ["Pending", "Confirmed", "CheckedIn"] },
    });

    if (existingUserBooking) {
      return res
        .status(400)
        .json({ message: "You already have an active booking for this room" });
    }

    const overlappingBooking = await Booking.findOne({
      room: room,
      status: { $in: ["Confirmed", "CheckedIn"] },
      $or: [{ checkInDate: { $lt: end }, checkOutDate: { $gt: start } }],
    });

    if (overlappingBooking) {
      return res
        .status(400)
        .json({ message: "Room is unavailable for the selected dates" });
    }

    let extrasTotal = 0;
    if (Array.isArray(extras)) {
      extrasTotal = extras.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0,
      );
    }

    const roomTotal = roomDetails.pricePerNight * nights;
    const totalAmount = roomTotal + extrasTotal;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe expects cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: req.user.id,
        roomId: room,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      totalAmount,
    });
  } catch (error) {
    console.error("Create Payment Intent Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
      room,
      checkInDate,
      checkOutDate,
      guests,
      specialRequests,
      extras = [],
      paymentIntentId,
    } = req.body;

    // START PAYMENT VERIFICATION
    if (!paymentIntentId) {
      return res.status(400).json({ message: "Payment is required" });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      return res
        .status(400)
        .json({ message: "Payment failed or was not completed" });
    }
    // END PAYMENT VERIFICATION

    // Calculate total price based on room price * nights
    const roomDetails = await Room.findById(room);
    if (!roomDetails)
      return res.status(404).json({ message: "Room not found" });

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (nights <= 0) return res.status(400).json({ message: "Invalid dates" });

    // Double check availability to prevent race conditions during payment
    const overlappingBooking = await Booking.findOne({
      room: room,
      status: { $in: ["Confirmed", "CheckedIn"] },
      $or: [{ checkInDate: { $lt: end }, checkOutDate: { $gt: start } }],
    });

    if (overlappingBooking) {
      // Refund if double booked? For now just error
      return res
        .status(400)
        .json({
          message:
            "Room was booked by someone else while you were paying. Please contact support for refund.",
        });
    }

    let extrasTotal = 0;
    let sanitizedExtras = [];

    if (Array.isArray(extras)) {
      sanitizedExtras = extras.map((item) => ({
        name: item.name,
        price: Number(item.price),
      }));
      extrasTotal = sanitizedExtras.reduce(
        (sum, item) => sum + (item.price || 0),
        0,
      );
    }

    const roomTotal = roomDetails.pricePerNight * nights;
    const totalAmount = roomTotal + extrasTotal;

    const newBooking = new Booking({
      user: req.user.id, // From authMiddleware
      room,
      checkInDate,
      checkOutDate,
      totalAmount,
      guests,
      extras: sanitizedExtras,
      specialRequests,
      paymentIntentId: paymentIntentId,
      status: "Confirmed", // Auto-confirm since paid
    });

    await newBooking.save();

    // Create Billing Record
    const newBilling = new Billing({
      booking: newBooking._id,
      totalAmount: totalAmount,
      paidAmount: totalAmount,
      status: "Paid",
      paymentMethod: "Stripe",
      items: [
        { description: `Room Charge (${nights} nights)`, amount: roomTotal },
        ...sanitizedExtras.map((e) => ({
          description: `Extra: ${e.name}`,
          amount: e.price,
        })),
      ],
    });
    await newBilling.save();

    res
      .status(201)
      .json({ message: "Booking confirmed successfully", booking: newBooking });

    // Real-time notification & Persistence
    try {
      await pusher.trigger('private-staff', 'new_booking', {
        message: `New booking: Room ${roomDetails.roomNumber} for $${totalAmount}`,
        booking: newBooking,
      });
    } catch (pushError) {
      console.error('Pusher Error:', pushError);
    }

    // Save Notification
    await new Notification({
      type: "booking",
      message: `New booking: Room ${roomDetails.roomNumber} for $${totalAmount}`,
      data: { bookingId: newBooking._id, roomId: room },
    }).save();
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "guest") {
      filter.user = req.user.id;
    }

    const bookings = await Booking.find(filter)
      .populate("user", "username email")
      .populate("room", "roomNumber type pricePerNight")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("user", "username email")
      .populate("room", "roomNumber type pricePerNight");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Access control
    if (
      req.user.role === "guest" &&
      booking.user._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // 1. Fetch Booking first to check permissions
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // 2. Access Control
    if (req.user.role === "guest") {
      // Guest must own the booking
      if (booking.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      // Guest can only Cancel
      if (status !== "Cancelled") {
        return res
          .status(403)
          .json({ message: "Guests can only cancel bookings" });
      }
    }

    // 3. Update Status
    booking.status = status;
    await booking.save();

    // Synchronize Room Status
    const today = new Date();
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);

    // If booking is active (Confirmed/CheckedIn) and today is within range
    if (["Confirmed", "CheckedIn"].includes(status)) {
      // Reset time parts for accurate date comparison
      today.setHours(0, 0, 0, 0);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);

      if (today >= checkIn && today <= checkOut) {
        await Room.findByIdAndUpdate(booking.room, { status: "Occupied" });
      }

      // Emit Check-in Event
      if (status === "CheckedIn") {
         try {
           await pusher.trigger('private-staff', 'check_in', {
             message: `Guest Checked In: Room ${booking.room.roomNumber || "Unknown"}`,
             booking,
           });
         } catch (e) { console.error(e); }
      }
    }
    // If booking is finished or invalid, free up the room
    else if (["CheckedOut", "Cancelled", "Rejected"].includes(status)) {
      await Room.findByIdAndUpdate(booking.room, { status: "Available" });

      // Emit Check-out Event
      if (status === "CheckedOut") {
         try {
           await pusher.trigger('private-staff', 'check_out', {
            message: `Guest Checked Out: Room ${booking.room.roomNumber || "Unknown"}`,
            booking,
           });
         } catch(e) { console.error(e); }
      }

      // REFUND LOGIC
      if (
        ["Cancelled", "Rejected"].includes(status) &&
        booking.paymentIntentId
      ) {
        try {
          // 1. Process Refund with Stripe
          await stripe.refunds.create({
            payment_intent: booking.paymentIntentId,
            metadata: { reason: `Booking ${status}` },
          });

          // 2. Update Billing Record
          await Billing.findOneAndUpdate(
            { booking: booking._id },
            { status: "Refunded" },
          );

          // Emit Payment Reversed Event
          try {
             await pusher.trigger('private-staff', 'payment_reversed', {
              message: `Payment Refunded: $${booking.totalAmount} for Booking #${booking._id.toString().slice(-6)}`,
              booking,
             });
          } catch(e) { console.error(e); }

          // Save Notification
          await new Notification({
            type: "payment_reversed",
            message: `Payment Refunded: $${booking.totalAmount} for Booking #${booking._id.toString().slice(-6)}`,
            data: { bookingId: booking._id },
          }).save();
        } catch (refundError) {
          console.error("Refund failed:", refundError);
          // We don't stop the cancellation, but we log the error
          // In a real app, you might want to return a warning
        }
      }
    }

    res.json({ message: "Booking status updated", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUnavailableDates = async (req, res) => {
    try {
        const { roomId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
             return res.status(400).json({ message: 'Invalid Room ID' });
        }

        // Find all active bookings for this room
        const bookings = await Booking.find({
            room: roomId,
            status: { $in: ['Pending', 'Confirmed', 'CheckedIn'] }
        }).select('checkInDate checkOutDate -_id');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
