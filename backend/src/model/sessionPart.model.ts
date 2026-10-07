import { Schema, model, Types, InferSchemaType } from 'mongoose';

export interface PopulatedSession {
  _id: Types.ObjectId;
  deleted: boolean;
  activity: {
    id: Types.ObjectId;
    name: string;
  };
}

export const sessionPopulateConfig = {
  path: 'session',
  select: '_id deleted activity',
  populate: {
    path: 'activity',
    select: 'name id',
  },
};

export interface ISessionPart {
  _id: Types.ObjectId;
  spentSeconds: number;
  session: PopulatedSession;
  user: Types.ObjectId;
  paused: boolean;
  createdDate: Date;
}

const sessionPartSchema = new Schema({
  spentSeconds: {
    type: Number,
    required: true,
    min: [0, 'spentSeconds should be minimum 0 second'],
    max: [36000, 'spentSeconds should be maximum 10 hours'],
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  paused: {
    type: Boolean,
    default: false,
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
});

sessionPartSchema.index({ user: 1, createdDate: 1 });

const SessionPart = model('SessionPart', sessionPartSchema, 'session_parts');

export default SessionPart;

export type SessionPartType = InferSchemaType<typeof sessionPartSchema>;

export type PopulatedSessionPartType = SessionPartType & {
  session: {
    activity: {
      name: string;
    };
  };
};
