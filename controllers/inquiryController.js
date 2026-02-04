import Inquiry from '../models/Inquiry.js';
import sendEmail from '../utils/sendEmail.js';
import Notification from '../models/Notification.js';
import pusher from "../utils/pusher.js";

// @desc    Create a new inquiry (Public)
// @route   POST /api/inquiries
// @access  Public
export const createInquiry = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const newInquiry = new Inquiry({
      name,
      email,
      subject,
      message
    });

    await newInquiry.save();

    // Real-time notification
    try {
        await pusher.trigger('private-staff', 'new_inquiry', {
            message: `New inquiry from ${name}: ${subject}`,
            inquiry: newInquiry
        });
    } catch(e) { console.error(e); }

    // Save Notification
    await new Notification({
        type: 'inquiry',
        message: `New inquiry from ${name}: ${subject}`,
        data: { inquiryId: newInquiry._id }
    }).save();

    res.status(201).json({ message: 'Inquiry sent successfully', inquiry: newInquiry });
  } catch (error) {
    console.error('Create Inquiry Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private (Admin/Receptionist/Manager)
export const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (error) {
    console.error('Get Inquiries Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reply to an inquiry
// @route   POST /api/inquiries/:id/reply
// @access  Private (Admin/Receptionist/Manager)
export const replyToInquiry = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    if (inquiry.status === 'Replied') {
      return res.status(400).json({ message: 'Inquiry already replied to' });
    }

    // Send Email
    try {
        await sendEmail({
            email: inquiry.email,
            subject: `Re: ${inquiry.subject} - Response from LuxuryStay`,
            message: `Dear ${inquiry.name},\n\n${replyMessage}\n\nBest regards,\nLuxuryStay Team`
        });
    } catch (emailError) {
        console.error('Email sending failed:', emailError);
        return res.status(500).json({ message: 'Failed to send email reply' });
    }

    // Update Database
    inquiry.reply = replyMessage;
    inquiry.status = 'Replied';
    inquiry.repliedAt = Date.now();
    await inquiry.save();

    res.json({ message: 'Reply sent successfully', inquiry });

  } catch (error) {
    console.error('Reply Inquiry Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
