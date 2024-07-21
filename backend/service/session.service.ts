import Session from '../model/session.model'
import Activity from '../model/activity.model'
import { SessionDTO } from '../dto/session.dto'
import mongoose from 'mongoose'

export default {

   async getSessions() {
      try {
         const sessions = await Session.find({ deleted: false }).populate('activity')
         return sessions
      } catch (e) {
         console.log(e)
      }
   },

   async getSessionsForActivity(activityId: string) {
      try {
         const sessions = await Session.find({ activity: activityId, deleted: false }).exec()
         return sessions
      } catch (e) {
         console.log(e)
      }
   },

   async createSession(sessionDTO: SessionDTO) {
      try {
         await Activity.exists({ _id: sessionDTO.activity })

         const newSession = new Session({
            totalTimeSeconds: sessionDTO.totalTimeSeconds,
            spentTimeSeconds: 0,
            activity: sessionDTO.activity
         })

         return (await newSession.save()).populate('activity')
      } catch (e) {
         if (e instanceof mongoose.Error.CastError) {
            throw new Error('Activity Not Found')
         }
      }
   },

   async updateSession(sessionId: string, sessionDTO: SessionDTO) {
      let completed = false
      if (sessionDTO.totalTimeSeconds === sessionDTO.spentTimeSeconds) {
         completed = true
      }

      try {
         await Session.exists({ _id: sessionId });

         await Session.findById(sessionId).updateOne({
            totalTimeSeconds: sessionDTO.totalTimeSeconds,
            spentTimeSeconds: sessionDTO.spentTimeSeconds,
            completed: completed,
            updatedDate: Date.now()
         })

         return await Session.findById(sessionId)
      } catch (e) {
         if (e instanceof mongoose.Error.CastError) {
            throw new Error('Session Not Found')
         }
      }
   },

   async deleteSession(sessionId: string) {
      try {
         await Session.exists({ _id: sessionId });

         await Session.findById(sessionId).updateOne({
            deleted: true
         })

         const message = {
            message: 'Deleted successful'
         }
         return message
      } catch (e) {
         if (e instanceof mongoose.Error.CastError) {
            throw new Error('Session Not Found')
         }
      }
   }
}