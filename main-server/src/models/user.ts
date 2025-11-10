import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
  username: string;
  password: string;
  email: string;
  avatarUrl: string;
}

export interface IUserDoc extends IUser, Document {}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    avatarUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  },
);

export const UserModel = mongoose.model('User', userSchema);
