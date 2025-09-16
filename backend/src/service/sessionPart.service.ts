import SessionPart, { ISessionPart } from '../model/sessionPart.model';

interface PopulatedSession {
  deleted: boolean;
  activity: {
    name: string;
  };
}

const sessionPopulateConfig = {
  path: 'session',
  select: 'deleted activity',
  populate: {
    path: 'activity',
    select: 'name -_id',
  },
};

interface GetSessionPartsInDateRangeOptions {
  startRange: Date;
  endRange: Date;
  userId: string;
}

async function getSessionPartsInDateRange({
  startRange,
  endRange,
  userId,
}: GetSessionPartsInDateRangeOptions): Promise<ISessionPart[]> {
  try {
    const sessionParts = await SessionPart.find({
      createdDate: { $gte: startRange, $lte: endRange },
      user: userId,
    }).populate<{
      session: PopulatedSession;
    }>(sessionPopulateConfig);
    // TODO: populate не работает? почему-то не могу получить activity из session (session: { _id: new ObjectId('68c823e5fed1645ee4017257'), deleted: false }) только эта инфа отображатеся. Но это лишь иногда да

    const filteredSessionsParts = sessionParts.filter(
      (sessionPart) => !sessionPart.session.deleted
    );

    return filteredSessionsParts;
  } catch (e) {
    throw e;
  }
}

export default {
  getSessionPartsInDateRange,
};
