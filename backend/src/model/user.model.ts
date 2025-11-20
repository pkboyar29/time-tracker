import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: false,
    minLength: [2, 'firstName minimum length is 2 characters'],
    maxLength: [20, 'firstName maximum length is 20 characters'],
  },
  lastName: {
    type: String,
    required: false,
    minLength: [2, 'lastName minimum length is 2 characters'],
    maxLength: [20, 'lastName maximum length is 20 characters'],
  },
  email: {
    type: String,
    required: true,
    minLength: [6, 'email minimum length is 6 characters'],
    maxLength: [40, 'email maximum length is 40 characters'],
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Invalid email format',
    ],
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
  createdDate: {
    type: Date,
    default: Date.now(),
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
