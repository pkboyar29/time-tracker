import '../model/activity.model';
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

interface GetSpentTimeSecondsInDateRange {
  startRange: Date;
  endRange: Date;
  userId: string;
}

const sessionPartService = {
  getSessionPartsInDateRange,
  getSpentTimeSecondsInDateRange,
};

async function getSessionPartsInDateRange({
  startRange,
  endRange,
  userId,
}: GetSessionPartsInDateRangeOptions): Promise<ISessionPart[]> {
  try {
    // TODO: все равно запрашиваем все session parts, даже удаленных сессий. Можно делать напрямую Aggregation $lookup + $match.
    // Либо можно начать хранить sessionDeleted в самом session part (то есть будем хранить дополнительный флаг, с которым запрос станет простым)
    const sessionParts = await SessionPart.find({
      createdDate: { $gte: startRange, $lte: endRange },
      user: userId,
    }).populate<{
      session: PopulatedSession;
    }>({ ...sessionPopulateConfig, match: { deleted: false } });
    const filteredSessionsParts = sessionParts.filter(
      (sessionPart) => sessionPart.session !== null,
    );

    return filteredSessionsParts;
  } catch (e) {
    throw e;
  }
}

async function getSpentTimeSecondsInDateRange({
  startRange,
  endRange,
  userId,
}: GetSpentTimeSecondsInDateRange): Promise<number> {
  try {
    const sessionParts = await sessionPartService.getSessionPartsInDateRange({
      startRange,
      endRange,
      userId,
    });

    const spentTimeSeconds = sessionParts.reduce(
      (seconds, part) => seconds + part.spentTimeSeconds,
      0,
    );

    return spentTimeSeconds;
  } catch (e) {
    throw e;
  }
}

export default sessionPartService;
