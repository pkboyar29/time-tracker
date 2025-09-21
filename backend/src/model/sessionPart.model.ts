import { Schema, model, Types, InferSchemaType } from 'mongoose';

export interface ISessionPart {
  _id: Types.ObjectId;
  spentTimeSeconds: number;
  session: { activity: { name: string } };
  user: Types.ObjectId;
  createdDate: Date;
}

const sessionPartSchema = new Schema({
  spentTimeSeconds: {
    type: Number,
    required: true,
    min: [0, 'SpentTimeSeconds should be minimum 0 second'],
    max: [36000, 'SpentTimeSeconds should be maximum 10 hours'],
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
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
