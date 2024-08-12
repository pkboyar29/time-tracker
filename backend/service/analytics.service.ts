import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import mongoose from 'mongoose';
import { endOfDay, startOfDay, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsForRange {
  sessionsAmount: number;
  spentTimeSeconds: number;
  sessions?: mongoose.Document[];
}

export default {
  async getAnalyticsForRange(
    startOfRange: Date,
    endOfRange: Date
  ): Promise<AnalyticsForRange | undefined> {
    try {
      let spentTimeSeconds: number = 0;
      let sessionsAmount: number = 0;

      const sessionPartsForRange =
        await sessionPartService.getSessionPartsInDateRange(
          startOfRange,
          endOfRange
        );
      if (sessionPartsForRange && sessionPartsForRange.length > 0) {
        spentTimeSeconds = sessionPartsForRange.reduce(
          (spentTimeSeconds, sessionPart) =>
            spentTimeSeconds + sessionPart.spentTimeSeconds,
          0
        );
      }

      const sessionsForRange = await sessionService.getSessions({
        updatedDate: { $gte: startOfRange, $lte: endOfRange },
        completed: true,
      });
      if (sessionsForRange && sessionsForRange.length > 0) {
        sessionsAmount = sessionsForRange.length;
      }

      return {
        sessionsAmount,
        spentTimeSeconds,
        sessions: sessionsForRange,
      };
    } catch (e) {
      this.handleError(e);
    }
  },

  async getAnalyticsForDay(
    dateWithDay: Date
  ): Promise<AnalyticsForRange | undefined> {
    const startDay: Date = startOfDay(dateWithDay);
    const endDay: Date = endOfDay(dateWithDay);

    return this.getAnalyticsForRange(startDay, endDay);
  },

  async getAnalyticsForMonth(
    dateWithMonth: Date
  ): Promise<AnalyticsForRange | undefined> {
    const startMonth: Date = startOfMonth(dateWithMonth);
    const endMonth: Date = endOfMonth(dateWithMonth);
    return this.getAnalyticsForRange(startMonth, endMonth);
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
