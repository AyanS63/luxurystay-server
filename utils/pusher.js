import Pusher from 'pusher';
import dotenv from 'dotenv';
dotenv.config();

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || "APP_ID",
  key: process.env.PUSHER_KEY || "KEY",
  secret: process.env.PUSHER_SECRET || "SECRET",
  cluster: process.env.PUSHER_CLUSTER || "ap2", // Default to India cluster or change as needed
  useTLS: true
});

export default pusher;
