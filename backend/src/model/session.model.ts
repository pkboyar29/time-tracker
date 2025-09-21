import { InferSchemaType, Schema, Types, model } from 'mongoose';

export interface ISession {
  _id: Types.ObjectId;
  totalTimeSeconds: number;
  spentTimeSeconds: number;
  note?: string | null;
  completed: boolean;
  activity: { name: string };
  user: Types.ObjectId;
  createdDate: Date;
  updatedDate: Date;
  deleted: boolean;
}

const sessionSchema = new Schema({
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
    maxLength: [
      1600,
      'Note is too long. Maximum allowed length is 1600 characters',
    ],
  },
  completed: {
    type: Boolean,
    default: false,
    required: true,
  },
  activity: {
    type: Schema.Types.ObjectId,
    ref: 'Activity',
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
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

sessionSchema.index({ user: 1, updatedDate: 1 });

const Session = model('Session', sessionSchema, 'sessions');

export default Session;

export type SessionType = InferSchemaType<typeof sessionSchema>;

export type PopulatedSessionType = SessionType & {
  activity: {
    name: string;
  };
};
