import mongoose from 'mongoose';
import SessionPart from '../model/sessionPart.model';

const MONGO_URL = process.env.MONGO_URL || '';

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

async function deleteSessionPartsWithZeroTime() {
  await SessionPart.deleteMany({ spentTimeSeconds: 0 });
  console.log('Successful');
}

deleteSessionPartsWithZeroTime();
