import mongoose from 'mongoose';
import analyticsService from '../service/analytics.service';
import User from '../model/user.model';

const MONGO_URL =
  process.env.MONGO_URL || 'mongodb://mongo_db:27017/time_tracker';

mongoose.connect(MONGO_URL).then(async () => {
  console.log('connection with database is successful');

  await addStreakToUsers();

  await mongoose.disconnect();
});

async function addStreakToUsers() {
  const allUsers = await User.find({}).exec();

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const streak = await analyticsService.calculateStreak({
      userId: user.id.toString(),
      timezone: user.timezone,
      dailyGoalSeconds: user.dailyGoal,
    });

    user.streak = streak;
    if (streak > 0) {
      user.streak_updated_at = user.daily_goal_completed_at;
    }
  }

  await User.bulkSave(allUsers);
  console.log('Successful');
}
