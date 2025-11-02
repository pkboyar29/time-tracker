import mongoose from 'mongoose';
import User from '../model/user.model';

const MONGO_URL = process.env.MONGO_URL || '';

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

async function addCreatedDateToUsers() {
  const allUsers = await User.find({}).exec();
  for (let i = 0; i < allUsers.length; i++) {
    allUsers[i].createdDate = allUsers[i]._id.getTimestamp();
  }
  await User.bulkSave(allUsers);
  console.log('Successful');
}

addCreatedDateToUsers();
