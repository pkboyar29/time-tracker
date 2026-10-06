import '../model/activity.model';
import SessionPart, {
  ISessionPart,
  PopulatedSession,
  sessionPopulateConfig,
} from '../model/sessionPart.model';

interface GetSessionPartsInRangeOptions {
  startRange: Date;
  endRange: Date;
  userId: string;
}

interface GetSpentSecondsInRangeOptions {
  startRange: Date;
  endRange: Date;
  userId: string;
}

const sessionPartService = {
  getSessionPartsInDateRange,
  getSpentSecondsInDateRange,
};

async function getSessionPartsInDateRange({
  startRange,
  endRange,
  userId,
}: GetSessionPartsInRangeOptions): Promise<ISessionPart[]> {
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

async function getSpentSecondsInDateRange({
  startRange,
  endRange,
  userId,
}: GetSpentSecondsInRangeOptions): Promise<number> {
  try {
    const sessionParts = await sessionPartService.getSessionPartsInDateRange({
      startRange,
      endRange,
      userId,
    });

    const spentSeconds = sessionParts.reduce((seconds, part) => seconds + part.spentSeconds, 0);
    return spentSeconds;
  } catch (e) {
    throw e;
  }
}

export default sessionPartService;
