import { Schema, model, Types } from 'mongoose';

export interface IDailyAD {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  activity: Types.ObjectId;
  spentTimeSeconds: number;
  sessionsAmount: number;
  pausedAmount: number;
  date: string;
}

const dailyActivityDistributionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activity: {
    type: Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  },
  spentTimeSeconds: {
    type: Number,
    required: true,
    min: 0,
  },
  sessionsAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  pausedAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
});

const DailyActivityDistribution = model<IDailyAD>(
  'DailyActivityDistribution',
  dailyActivityDistributionSchema,
  'daily_activity_distributions',
);

export default DailyActivityDistribution;
