export const mapActivityFromResponse = (unmappedActivity: any): Activity => {
   return {
      id: unmappedActivity._id,
      ...unmappedActivity
   }
}

export const mapSessionFromResponse = (unmappedSession: any): Session => {
   return {
      id: unmappedSession._id,
      ...unmappedSession
   }
}