import mongoose from "mongoose";
import { envs } from ".";

export const connectDb = async () => {
  try {
    await mongoose.connect(envs.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
    });
    console.log("Database connected");
  } catch (error) {
    console.log("Failed to connect to database", error);
  }
};
