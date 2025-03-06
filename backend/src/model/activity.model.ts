import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    maxLength: 50,
    minLength: 1,
    required: true,
  },
  descr: {
    type: String,
    maxLength: 500,
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
