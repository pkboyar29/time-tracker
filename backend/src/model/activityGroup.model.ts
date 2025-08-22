import mongoose from 'mongoose';

const activityGroupSchema = new mongoose.Schema({
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

const ActivityGroup = mongoose.model(
  'ActivityGroup',
  activityGroupSchema,
  'activity_groups'
);

export default ActivityGroup;
