import mongoose from 'mongoose';
import Activity from '../model/activity.model';

const MONGO_URL = process.env.MONGO_URL || '';

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

function getRandomBrightColor() {
  let r, g, b;

  do {
    r = Math.floor(Math.random() * 256);
    g = Math.floor(Math.random() * 256);
    b = Math.floor(Math.random() * 256);
  } while (r + g + b < 400); // порог яркости

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

async function addColorToActivities() {
  const allActivities = await Activity.find({}).exec();
  for (let i = 0; i < allActivities.length; i++) {
    allActivities[i].color = getRandomBrightColor();
  }

  await Activity.bulkSave(allActivities);
  console.log('Activities in database updated');
}

addColorToActivities();
