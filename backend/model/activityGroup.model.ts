import mongoose from 'mongoose';

const activityGroupSchema = new mongoose.Schema({
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
