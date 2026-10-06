import mongoose from 'mongoose';
import SessionPart from '../model/sessionPart.model';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://mongo_db:27017/time_tracker';

mongoose.connect(MONGO_URL).then(async () => {
  console.log('connection with database is successful');

  await renameFields();

  await mongoose.disconnect();
});

async function renameFields() {
  console.log('renaming spentTimeSeconds to spentSeconds in session_parts...');
  const result = await SessionPart.collection.updateMany(
    {},
    {
      $rename: {
        spentTimeSeconds: 'spentSeconds',
      },
    },
  );
  console.log(result);

  // TODO: переименовать в модели session, одновременно переименовав все в коде
  // TODO: переименовать в модели activity, одновременно переименовав все в коде
  // TODO: переименовать в модели activityGroup, одновременно переименовав все в коде
  // TODO: переименовать в модели dailyAggregate, одновременно переименовав все в коде
  // TODO: переименовать в модели dailyActivityDistribution, одновременно переименовав все в коде

  console.log('Successfull');
}
