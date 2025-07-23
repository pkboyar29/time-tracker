import mongoose, { InferSchemaType } from 'mongoose';

const sessionSchema = new mongoose.Schema({
  totalTimeSeconds: {
    type: Number,
    required: true,
    min: [1, 'TotalTimeSeconds should be minimum 1 second'],
    max: [36000, 'TotalTimeSeconds should be maximum 10 hours'],
  },
  spentTimeSeconds: {
    type: Number,
    required: true,
    min: [0, 'SpentTimeSeconds should be minimum 0 second'],
    max: [36000, 'SpentTimeSeconds should be maximum 10 hours'],
  },
  note: {
    type: String,
    required: false,
    minLength: 1,
    maxLength: 300,
  },
  completed: {
    type: Boolean,
    default: false,
    required: true,
  },
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
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

const Session = mongoose.model('Session', sessionSchema, 'sessions');

export default Session;

export type SessionType = InferSchemaType<typeof sessionSchema>;
