import mongoose from 'mongoose';

const userTopActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const UserTopActivity = mongoose.model(
  'UserTopActivity',
  userTopActivitySchema,
  'user_top_activities'
);

export default UserTopActivity;
