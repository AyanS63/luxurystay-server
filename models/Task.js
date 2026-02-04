import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff member (Housekeeping)
  description: { type: String, required: true },
  type: {
     type: String,
     enum: ['Cleaning', 'Maintenance', 'Inspection'],
     default: 'Cleaning'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who reported (could be guest or staff)
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

export default mongoose.model('Task', TaskSchema);
