import { Types, Schema, model } from 'mongoose';

export interface IActivityGroup {
  _id: Types.ObjectId;
  name: string;
  descr?: string | null;
  user: Types.ObjectId;
  deleted: boolean;
  createdDate: Date;
  updatedDate: Date;
  sessionsAmount: number;
  spentTimeSeconds: number;
}

const activityGroupSchema = new Schema({
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
  sessionsAmount: {
    type: Number,
    default: 0,
    required: true,
  },
  spentTimeSeconds: {
    type: Number,
    default: 0,
    required: true,
  },
});

const ActivityGroup = model(
  'ActivityGroup',
  activityGroupSchema,
  'activity_groups'
);

export default ActivityGroup;
