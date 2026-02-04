import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from './models/Room.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('Connected to DB');
    const count = await Room.countDocuments();
    console.log(`Total Rooms in DB: ${count}`);
    const rooms = await Room.find({});
    console.log('Rooms:', rooms);
    process.exit();
})
.catch(err => {
    console.error(err);
    process.exit(1);
});
