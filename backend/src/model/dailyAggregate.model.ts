import { Schema, model, Types } from 'mongoose';

export interface IDailyAggregate {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  spentTimeSeconds: number;
  sessionsAmount: number;
  pausedAmount: number;
  date: string;
}

const dailyAggregateSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
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

const DailyAggregate = model<IDailyAggregate>(
  'DailyAggregate',
  dailyAggregateSchema,
  'daily_aggregates',
);

export default DailyAggregate;
