import SessionPart, { ISessionPart } from '../model/sessionPart.model';
import mongoose from 'mongoose';

interface PopulatedSession {
  deleted: boolean;
  activity: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
}

const sessionPopulateConfig = {
  path: 'session',
  select: 'deleted activity',
  populate: {
    path: 'activity',
    select: 'name id',
  },
};

interface GetSessionPartsInDateRangeOptions {
  startRange: Date;
  endRange: Date;
  userId: string;
}

const sessionPartService = {
  getSessionPartsInDateRange,
};

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

    const filteredSessionsParts = sessionParts.filter(
      (sessionPart) => !sessionPart.session.deleted,
    );

    return filteredSessionsParts;
  } catch (e) {
    throw e;
  }
}

export default sessionPartService;
