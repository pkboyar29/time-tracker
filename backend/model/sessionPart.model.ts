import mongoose from 'mongoose';

const sessionPartSchema = new mongoose.Schema({
  spentTimeSeconds: {
    type: Number,
    required: true,
    min: [0, 'SpentTimeSeconds should be minimum 0 second'],
    max: [36000, 'SpentTimeSeconds should be maximum 10 hours'],
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
});

const SessionPart = mongoose.model(
  'SessionPart',
  sessionPartSchema,
  'session_parts'
);

export default SessionPart;
