import express from 'express';
import Message from '../models/Message.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import pusher from '../utils/pusher.js';

const router = express.Router();

// Pusher Authentication
router.post('/auth', verifyToken, (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;

  if (channel === 'private-staff') {
      if (!['admin', 'manager', 'receptionist', 'hotel_staff'].includes(req.user.role)) {
          return res.status(403).json({ message: 'Unauthorized for staff channel' });
      }
  }

  const presenceData = {
    user_id: req.user.id,
    user_info: {
      username: req.user.username,
      role: req.user.role
    }
  };
  // For private channels:
  const authResponse = pusher.authorizeChannel(socketId, channel, presenceData);
  res.send(authResponse);
});

// Send Message
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { receiver, message } = req.body;
    const sender = req.user.id;

    const newMessage = new Message({ sender, receiver, message });
    await newMessage.save();
    
    // Populate sender details
    await newMessage.populate('sender', 'username role');

    // Trigger event on receiver's private channel
    await pusher.trigger(`private-user-${receiver}`, 'receive_message', newMessage);
    
    // Optionally trigger on sender's channel too if you want multi-device sync, 
    // but usually the client optimistic update handles this.

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get chat history between current user and another user
router.get('/history/:userId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username role')
    .populate('receiver', 'username role');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history', error: error.message });
  }
});

// Mark messages as read
router.put('/read/:userId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

export default router;
