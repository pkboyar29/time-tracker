import mongoose from 'mongoose';
import SessionPart from '../model/sessionPart.model';
import Session from '../model/session.model';
import Activity from '../model/activity.model';
import ActivityGroup from '../model/activityGroup.model';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo_db:27017/time_tracker';

mongoose.connect(MONGO_URL).then(async () => {
  console.log('connection with database is successful');

  await renameFields();

  await mongoose.disconnect();
});

async function renameFields() {
  console.log('renaming spentTimeSeconds to spentSeconds in session_parts...');
  const partsResult = await SessionPart.collection.updateMany(
    {},
    { $rename: { spentTimeSeconds: 'spentSeconds' } },
  );
  console.log(partsResult);

  console.log(
    'renaming spentTimeSeconds to spentSeconds and totalTimeSeconds to totalSeconds in sessions...',
  );
  const sessionsResult = await Session.collection.updateMany(
    {},
    { $rename: { spentTimeSeconds: 'spentSeconds', totalTimeSeconds: 'totalSeconds' } },
  );
  console.log(sessionsResult);

  console.log('renaming spentTimeSeconds to spentSeconds in activities...');
  const activitiesResult = await Activity.collection.updateMany(
    {},
    { $rename: { spentTimeSeconds: 'spentSeconds' } },
  );
  console.log(activitiesResult);

  console.log('renaming spentTimeSeconds to spentSeconds in activity_groups...');
  const groupsResult = await ActivityGroup.collection.updateMany(
    {},
    { $rename: { spentTimeSeconds: 'spentSeconds' } },
  );
  console.log(groupsResult);

  // TODO: переименовать в модели dailyAggregate, одновременно переименовав все в коде
  // TODO: переименовать в модели dailyActivityDistribution, одновременно переименовав все в коде

  console.log('Successfull');
}
