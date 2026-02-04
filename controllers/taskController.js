import Task from '../models/Task.js';
import Room from '../models/Room.js';

export const createTask = async (req, res) => {
  try {
    const { room, description, type, priority, assignedTo } = req.body;
    
    const newTask = new Task({
      room,
      description,
      type: type || 'Cleaning',
      priority: priority || 'Medium',
      assignedTo: assignedTo || null, // Can be assigned later
      reportedBy: req.user.id
    });

    await newTask.save();

    // Sync Room Status - Use properties from the saved task to handle defaults
    if (newTask.type === 'Cleaning' || newTask.type === 'Maintenance') {

      await Room.findByIdAndUpdate(room, { status: newTask.type });
    }

    res.status(201).json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    // Populate room and assigned user details
    const tasks = await Task.find()
      .populate('room', 'roomNumber type')
      .populate('assignedTo', 'username')
      .populate('reportedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;
    
    if (status === 'In Progress') {
       if (task.type === 'Cleaning') {
          await Room.findByIdAndUpdate(task.room, { status: 'Cleaning' });
       } else if (task.type === 'Maintenance') {
          await Room.findByIdAndUpdate(task.room, { status: 'Maintenance' });
       }
    }

    if (status === 'Completed') {
      task.completedAt = new Date();
      // Revert room to Available
      await Room.findByIdAndUpdate(task.room, { status: 'Available' });
    }

    await task.save();
    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteCompletedTasks = async (req, res) => {
  try {
    const result = await Task.deleteMany({ status: 'Completed' });
    res.json({ message: 'Completed tasks cleared successfully', count: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
