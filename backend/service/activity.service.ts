import Activity from '../model/activity.model'
import { ActivityDTO } from '../dto/activity.dto'
import mongoose from 'mongoose'
import sessionService from './session.service'

export default {

   async getActivities() {
      try {
         const activities = await Activity.find({ deleted: false })

         const detailedActivitiesPromises = activities.map(async (activity: any, index: number) => {
            const sessions = await sessionService.getSessionsForActivity(activity._id)

            const spentTimeSeconds = sessions?.reduce((total: number, session: any) => total + session.spentTimeSeconds, 0)

            return {
               ...activity.toObject(),
               sessionsAmount: sessions?.length,
               spentTimeSeconds: spentTimeSeconds
            }
         })

         // ждем выполнения всех промисов
         const detailedActivities = await Promise.all(detailedActivitiesPromises)

         return detailedActivities
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