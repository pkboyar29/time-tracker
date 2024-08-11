import SessionPart from '../model/sessionPart.model';

interface PopulatedSession {
  deleted: boolean;
}

export default {
  async getSessionPartsInDateRange(startRange: Date, endRange: Date) {
    try {
      const sessionParts = await SessionPart.find({
        createdDate: { $gte: startRange, $lte: endRange },
      }).populate<{
        session: PopulatedSession;
      }>('session');
      const notDeletedSessionsParts = sessionParts.filter(
        (sessionPart) => !sessionPart.session.deleted
      );

      return notDeletedSessionsParts;
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
