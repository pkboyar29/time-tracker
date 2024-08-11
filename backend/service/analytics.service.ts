import sessionService from '../service/session.service';
import sessionPartService from './sessionPart.service';
import { endOfDay, startOfDay } from 'date-fns';

interface AnalyticsForDay {
  sessionsAmount: number;
  spentTimeSeconds: number;
}

export default {
  async getAnalyticsForDay(date: Date): Promise<AnalyticsForDay | undefined> {
    try {
      let spentTimeSeconds: number = 0;
      let sessionsAmount: number = 0;

      const startRange: Date = startOfDay(date);
      const endRange: Date = endOfDay(date);

      const sessionPartsForDay =
        await sessionPartService.getSessionPartsInDateRange(
          startRange,
          endRange
        );
      if (sessionPartsForDay && sessionPartsForDay.length > 0) {
        spentTimeSeconds = sessionPartsForDay.reduce(
          (spentTimeSeconds, sessionPart) =>
            spentTimeSeconds + sessionPart.spentTimeSeconds,
          0
        );
      }

      const sessionsForDay = await sessionService.getSessions({
        updatedDate: { $gte: startRange, $lte: endRange },
        completed: true,
      });
      if (sessionsForDay && sessionsForDay.length > 0) {
        sessionsAmount = sessionsForDay.length;
      }

      return {
        sessionsAmount,
        spentTimeSeconds,
      };
    } catch (e) {
      this.handleError(e);
    }
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
