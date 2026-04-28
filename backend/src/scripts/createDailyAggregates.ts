import mongoose from 'mongoose';
import DailyAggregate, { IDailyAggregate } from '../model/dailyAggregate.model';
import DailyActivityDistribution, {
  IDailyAD,
} from '../model/dailyActivityDistribution.model';
import Session from '../model/session.model';
import sessionPartService from '../service/sessionPart.service';
import User from '../model/user.model';
import { DateTime } from 'luxon';

const MONGO_URL =
  process.env.MONGO_URL || 'mongodb://mongo_db:27017/time_tracker';

mongoose.connect(MONGO_URL).then(async () => {
  console.log('connection with database is successful');

  await createDailyAggregates();

  await mongoose.disconnect();
});

async function createDailyAggregates() {
  const allUsers = await User.find({}).exec();

  for (let i = 0; i < allUsers.length; i++) {
    const userId = allUsers[i]._id;
    const userTimezone = allUsers[i].timezone;
    const userCreatedDate = allUsers[i].createdDate;

    const completedSessions = await Session.find({
      user: userId,
      completed: true,
      deleted: false,
    });

    const allParts = await sessionPartService.getSessionPartsInDateRange({
      startRange: userCreatedDate,
      endRange: new Date(),
      userId: userId.toString(),
    });
    if (allParts.length === 0) {
      continue;
    }

    // <string, ISessionPart[]>
    const datesMap = new Map<string, any[]>(); // TODO: если использовать ISessionPart[], то появится пара ts предупреждений
    for (let i = 0; i < allParts.length; i++) {
      const part = allParts[i];

      const dt = DateTime.fromJSDate(part.createdDate, { zone: userTimezone });
      const dateISO = dt.toISODate(); // YYYY-MM-DD

      if (!dateISO) {
        console.error(`Error while converting dt to ISO Date: ${dt}`);
        continue;
      }

      if (datesMap.has(dateISO)) {
        const parts = datesMap.get(dateISO);
        parts?.push(part);
      } else {
        datesMap.set(dateISO, [part]);
      }
    }

    const dailyAggregates: IDailyAggregate[] = [];
    const dailyAds: IDailyAD[] = [];

    for (const [dateISO, parts] of datesMap) {
      const totalSeconds = parts.reduce(
        (seconds, part) => seconds + part.spentTimeSeconds,
        0,
      );
      const totalPaused = parts.filter((part) => part.paused).length;

      const dayStartLuxon = DateTime.fromISO(dateISO, { zone: userTimezone });
      const nextDayStartLuxon = dayStartLuxon.plus({ days: 1 });
      const dayStartMs = dayStartLuxon.toJSDate().getTime();
      const nextDayStartMs = nextDayStartLuxon.toJSDate().getTime();

      const filteredSessions = completedSessions.filter((session) => {
        const date = session.updatedDate.getTime();

        return session.completed && date >= dayStartMs && date < nextDayStartMs;
      });

      dailyAggregates.push(
        new DailyAggregate({
          date: dateISO,
          user: userId,
          spentTimeSeconds: totalSeconds,
          sessionsAmount: filteredSessions.length,
          pausedAmount: totalPaused,
        }),
      );

      const activitiesMap = new Map<string, any[]>();
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part.session.activity) {
          continue;
        }

        const activityId = part.session.activity.id;
        if (activitiesMap.has(activityId)) {
          const parts = activitiesMap.get(activityId);
          parts?.push(part);
        } else {
          activitiesMap.set(activityId, [part]);
        }
      }

      for (const [activityId, parts] of activitiesMap) {
        const totalSeconds = parts.reduce(
          (seconds, part) => seconds + part.spentTimeSeconds,
          0,
        );
        const totalPaused = parts.filter((part) => part.paused).length;

        const activitySessions = filteredSessions.filter(
          (session) => session.activity && session.activity.equals(activityId),
        );

        dailyAds.push(
          new DailyActivityDistribution({
            date: dateISO,
            user: userId,
            activity: new mongoose.Types.ObjectId(activityId),
            spentTimeSeconds: totalSeconds,
            sessionsAmount: activitySessions.length,
            pausedAmount: totalPaused,
          }),
        );
      }
    }

    await DailyAggregate.insertMany(dailyAggregates);
    await DailyActivityDistribution.insertMany(dailyAds);
  }

  console.log('Successful');
}
