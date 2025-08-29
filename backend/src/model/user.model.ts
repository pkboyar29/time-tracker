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
    min: [60, 'Daily goal should be minimum 60 seconds'],
    max: [86400, 'Daily goal should be maximum 86400 seconds (24 hours)'],
  },
  showTimerInTitle: {
    type: Boolean,
    default: false,
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
