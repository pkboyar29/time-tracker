import SessionPart from '../model/sessionPart.model';

interface PopulatedSession {
  deleted: boolean;
}

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
      }>('session');
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
