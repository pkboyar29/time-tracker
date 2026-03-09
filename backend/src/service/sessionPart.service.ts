import SessionPart, { ISessionPart } from '../model/sessionPart.model';
import mongoose from 'mongoose';

interface PopulatedSession {
  _id: mongoose.Types.ObjectId;
  deleted: boolean;
  activity: {
    id: mongoose.Types.ObjectId;
    name: string;
  };
}

const sessionPopulateConfig = {
  path: 'session',
  select: '_id deleted activity',
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
    // TODO: можно не загружать из БД все parts с deleted сессиями, а потом фильтровать. Можно сразу загрузить что нужно
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
