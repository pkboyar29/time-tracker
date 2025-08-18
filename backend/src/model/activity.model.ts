import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    maxLength: [50, 'Name maximum length is 50 characters'],
    minLength: [1, 'Name minimum length is 1 characters'],
    required: true,
  },
  descr: {
    type: String,
    maxLength: [500, 'Description maximum length is 500 characters'],
    required: false,
  },
  activityGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityGroup',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  updatedDate: {
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

const Activity = mongoose.model('Activity', activitySchema, 'activities');

export default Activity;
