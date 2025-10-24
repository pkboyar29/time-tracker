import mongoose from 'mongoose';
import SessionPart from '../model/sessionPart.model';
import Session from '../model/session.model';

const MONGO_URL = process.env.MONGO_URL || '';

mongoose.connect(MONGO_URL).then(() => {
  console.log('connection with database is successful');
});

async function addPausedToSessionParts() {
  const allSessionParts = await SessionPart.find({}).exec();
  const allSessions = await Session.find({}).exec();

  const sessionsMap = new Map();

  for (let i = 0; i < allSessions.length; i++) {
    const session = allSessions[i];
    const sessionId = session._id.toString();

    const sessionParts = allSessionParts.filter((part) =>
      part.session._id.equals(sessionId)
    );

    sessionsMap.set(sessionId, sessionParts);
  }

  const allSessionPartsToUpdate = [];
  for (const [, sessionParts] of sessionsMap) {
    if (sessionParts.length == 1) {
      sessionParts[0].paused = false;
    } else if (sessionParts.length > 1) {
      for (let i = 0; i < sessionParts.length; i++) {
        if (i == 0) {
          sessionParts[i].paused = true;
        } else {
          sessionParts[i].paused = false;
        }
      }
    }

    allSessionPartsToUpdate.push(...sessionParts);
  }

  await SessionPart.bulkSave(allSessionPartsToUpdate);
  console.log('Successful');
}

addPausedToSessionParts();
