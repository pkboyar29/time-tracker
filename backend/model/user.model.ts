import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  dailyGoal: {
    type: Number,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const User = mongoose.model('User', userSchema, 'users');

export default User;
