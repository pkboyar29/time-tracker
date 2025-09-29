import { Schema, Types, model } from 'mongoose';

export interface IActivity {
  _id: Types.ObjectId;
  name: string;
  descr?: string;
  user: Types.ObjectId;
  activityGroup: Types.ObjectId;
  createdDate: Date;
  updatedDate: Date;
  archived: boolean;
  deleted: boolean;
}

export interface IDetailedActivity {
  _id: Types.ObjectId;
  name: string;
  descr?: string;
  user: Types.ObjectId;
  activityGroup: { _id: Types.ObjectId; name: string };
  createdDate: Date;
  updatedDate: Date;
  archived: boolean;
  deleted: boolean;
  sessionsAmount: number;
  spentTimeSeconds: number;
}

const activitySchema = new Schema<IActivity>({
  name: {
    type: String,
    maxLength: [50, 'Name maximum length is 50 characters'],
    minLength: [1, 'Name minimum length is 1 characters'],
    match: [/.*\S.*/, 'Name cannot consist only of spaces'],
    required: true,
  },
  descr: {
    type: String,
    maxLength: [500, 'Description maximum length is 500 characters'],
    required: false,
  },
  activityGroup: {
    type: Schema.Types.ObjectId,
    ref: 'ActivityGroup',
    required: true,
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
  archived: {
    type: Boolean,
    default: false,
    required: true,
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const Activity = model<IActivity>('Activity', activitySchema, 'activities');

export default Activity;
