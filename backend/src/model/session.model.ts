import { InferSchemaType, Schema, Types, model } from 'mongoose';

export interface PopulatedActivity {
  id: Types.ObjectId;
  name: string;
  color: string;
  activityGroup: { id: Types.ObjectId; name: string };
}

export const activityPopulateConfig = {
  path: 'activity',
  select: 'name color activityGroup id',
  populate: {
    path: 'activityGroup',
    select: 'name id',
  },
};

export interface ISession {
  _id: Types.ObjectId;
  totalSeconds: number;
  spentSeconds: number;
  note?: string | null;
  completed: boolean;
  activity: PopulatedActivity;
  user: Types.ObjectId;
  createdDate: Date;
  updatedDate: Date;
  deleted: boolean;
}

const sessionSchema = new Schema({
  totalSeconds: {
    type: Number,
    required: true,
    min: [1, 'totalSeconds should be minimum 1 second'],
    max: [36000, 'totalSeconds should be maximum 10 hours'],
  },
  spentSeconds: {
    type: Number,
    required: true,
    min: [0, 'spentSeconds should be minimum 0 second'],
    max: [36000, 'spentSeconds should be maximum 10 hours'],
  },
  note: {
    type: String,
    required: false,
    maxLength: [1600, 'Note is too long. Maximum allowed length is 1600 characters'],
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
