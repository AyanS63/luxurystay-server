import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

export const createReview = async (req, res) => {
  try {
    const { room, rating, comment } = req.body;
    const userId = req.user.id;

    // Optional: Check if user has actually booked/stayed in this room
    // For now, we'll allow any logged-in user to review, 
    // but typically you'd query the Booking model here.

    const review = new Review({
      room,
      user: userId,
      rating,
      comment
    });

    await review.save();

    // Populate user details to return immediately
    await review.populate('user', 'username');

    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this room' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getRoomReviews = async (req, res) => {
  try {
    const { roomId } = req.params;
    const reviews = await Review.find({ room: roomId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    let review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Verify user ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      { rating, comment },
      { new: true }
    ).populate('user', 'username');

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Verify user ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ message: 'Review removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
