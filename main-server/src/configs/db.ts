import mongoose from 'mongoose';
import { envs } from '.';

export let db: any = null;

export const connectDb = async () => {
  try {
    if (db) {
      console.log('Database already connected');
      return;
    }

    try {
      await mongoose.connect(envs.mongodbUri);
      db = mongoose.connection;

      console.log('Database connected');
    } catch (error) {
      console.log('Failed to connect to database', error);
    }
  } catch (error) {
    console.log('Failed to connect to database', error);
  }
};
