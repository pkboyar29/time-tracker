import Activity from '../model/activity.model'
import { ActivityDTO } from '../dto/activity.dto'
import mongoose from 'mongoose'

export default {

   async getActivities() {
      try {
         const activities = Activity.find({ deleted: false })
         return await activities
      } catch (e) {
         console.log(e)
      }
   },

   async createActivity(activityDTO: ActivityDTO) {
      try {
         const newActivity = new Activity({
            name: activityDTO.name,
            descr: activityDTO.descr
         })

         return await newActivity.save()
      } catch (e) {
         console.log(e)
      }
   },

   async updateActivity(activityId: string, activityDTO: ActivityDTO) {
      try {
         await Activity.exists({ _id: activityId })

         await Activity.findById(activityId).updateOne({
            name: activityDTO.name,
            descr: activityDTO.descr,
            updatedDate: Date.now()
         })

         return await Activity.findById(activityId)
      } catch (e) {
         if (e instanceof mongoose.Error.CastError) {
            throw new Error('Activity Not Found')
         }
      }
   },

   async deleteActivity(activityId: string) {
      try {
         await Activity.exists({ _id: activityId })

         await Activity.findById(activityId).updateOne({
            deleted: true
         })

         const message = {
            message: 'Deleted successful'
         }
         return message
      } catch (e) {
         if (e instanceof mongoose.Error.CastError) {
            throw new Error('Activity Not Found')
         }
      }
   }
}