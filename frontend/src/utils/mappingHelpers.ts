export const mapActivityFromResponse = (unmappedActivity: any): Activity => {
   return {
      id: unmappedActivity._id,
      name: unmappedActivity.name,
      descr: unmappedActivity.descr
   }
}

export const mapSessionFromResponse = (unmappedSession: any): Session => {
   return {
      id: unmappedSession._id,
      totalTimeSeconds: unmappedSession.totalTimeSeconds,
      spentTimeSeconds: unmappedSession.spentTimeSeconds,
      activity: unmappedSession.activity,
      completed: unmappedSession.completed,
   }
}