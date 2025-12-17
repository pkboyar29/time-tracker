import mongoose from 'mongoose';
import Activity from '../model/activity.model';
import ActivityGroup from '../model/activityGroup.model';
import Session from '../model/session.model';

const MONGO_URL = process.env.MONGO_URL || '';

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

async function addTimeInfoToActivities() {
  const allActivities = await Activity.find({}).exec();
  for (let i = 0; i < allActivities.length; i++) {
    if (allActivities[i].deleted) {
      allActivities[i].sessionsAmount = 0;
      allActivities[i].spentTimeSeconds = 0;
    } else {
      const activitySessions = await Session.find({
        completed: true,
        activity: allActivities[i]._id,
      });
      allActivities[i].sessionsAmount = activitySessions.length;
      allActivities[i].spentTimeSeconds = activitySessions.reduce(
        (seconds, session) => {
          return seconds + session.totalTimeSeconds;
        },
        0
      );
    }
  }

  await Activity.bulkSave(allActivities);
  console.log('Activities in database updated');

  const allActivityGroups = await ActivityGroup.find({}).exec();
  for (let i = 0; i < allActivityGroups.length; i++) {
    if (allActivityGroups[i].deleted) {
      allActivityGroups[i].spentTimeSeconds = 0;
      allActivityGroups[i].sessionsAmount = 0;
    } else {
      const groupActivities = allActivities.filter((activity) =>
        activity.activityGroup._id.equals(allActivityGroups[i]._id)
      );
      allActivityGroups[i].sessionsAmount = groupActivities.reduce(
        (sessions, activity) => {
          return sessions + activity.sessionsAmount;
        },
        0
      );
      allActivityGroups[i].spentTimeSeconds = groupActivities.reduce(
        (seconds, activity) => {
          return seconds + activity.spentTimeSeconds;
        },
        0
      );
    }
  }

  await ActivityGroup.bulkSave(allActivityGroups);
  console.log('Activity groups in database updated');
}

addTimeInfoToActivities();
