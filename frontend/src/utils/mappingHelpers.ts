export const mapActivityFromResponse = (unmappedActivity: any): IActivity => {
   return {
      id: unmappedActivity._id,
      ...unmappedActivity
   }
}

export const mapSessionFromResponse = (unmappedSession: any): ISession => {
   return {
      id: unmappedSession._id,
      activity: unmappedSession.activity && {
         id: unmappedSession.activity._id,
         ...unmappedSession.activity
      },
      ...unmappedSession
   }
}