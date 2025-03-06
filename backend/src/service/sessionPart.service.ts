import SessionPart from '../model/sessionPart.model';

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

export default {
  async getSessionPartsInDateRange(
    startRange: Date,
    endRange: Date,
    userId: string
  ) {
    try {
      const sessionParts = await SessionPart.find({
        createdDate: { $gte: startRange, $lte: endRange },
        user: userId,
      }).populate<{
        session: PopulatedSession;
      }>(sessionPopulateConfig);
      const filteredSessionsParts = sessionParts.filter(
        (sessionPart) => !sessionPart.session.deleted
      );

      return filteredSessionsParts;
    } catch (e) {
      this.handleError(e);
    }
  },

  handleError(e: unknown) {
    if (e instanceof Error) {
      throw new Error(e.message);
    }
  },
};
