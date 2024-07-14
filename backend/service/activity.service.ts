import Activity from '../model/activity.model'
import { ActivityDTO } from '../dto/activity.dto'

export default {

   async getActivities() {
      try {
         const activities = Activity.find({})
         return await activities
      } catch (e) {
         console.log(e)
      }
   },

   async createActivity(activityDTO: ActivityDTO) {
      const newActivity = new Activity({
         name: activityDTO.name,
         descr: activityDTO.descr
      })
      try {
         return await newActivity.save()
      } catch (e) {
         console.log(e)
      }
   },

   async updateActivity(activityId: string, activityDTO: ActivityDTO) {
      try {
         await Activity.findById(activityId).updateOne({
            name: activityDTO.name,
            descr: activityDTO.descr,
            updatedDate: Date.now()
         })

         return await Activity.findById(activityId)
      } catch (e) {
         console.log(e)
      }
   },

   async deleteActivity(activityId: string) {
      try {
         await Activity.deleteOne({ _id: activityId })

         const message = {
            message: 'Deleted successful'
         }
         return message
      } catch (e) {
         console.log(e)
      }
   }
}