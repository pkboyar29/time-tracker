import Session from '../model/session.model'
import { SessionDTO } from '../dto/session.dto'

export default {

   async createSession(sessionDTO: SessionDTO) {
      const newSession = new Session({
         totalTimeSeconds: sessionDTO.totalTimeSeconds,
         spentTimeSeconds: 0
      })
      try {
         return await newSession.save()
      } catch (e) {
         console.log(e)
      }
   },

   async updateSession(sessionId: string, sessionDTO: SessionDTO) {
      let completed = false
      if (sessionDTO.totalTimeSeconds === sessionDTO.spentTimeSeconds) {
         completed = true
      }

      try {
         // проверить существование по id, иначе выкатить ошибку
         await Session.findById(sessionId).updateOne({
            totalTimeSeconds: sessionDTO.totalTimeSeconds,
            spentTimeSeconds: sessionDTO.spentTimeSeconds,
            completed: completed,
            updatedDate: Date.now()
         })

         return await Session.findById(sessionId)
      } catch (e) {
         console.log(e)
      }
   },

   async deleteSession(sessionId: string) {
      try {
         // проверить существование по id, иначе выкатить ошибку
         await Session.deleteOne({ _id: sessionId })

         const message = {
            message: 'Deleted successful'
         }

         return message
      } catch (e) {
         console.log(e)
      }
   },

   async getSessions() {
      try {
         const sessions = Session.find({})
         return await sessions
      } catch (e) {
         console.log(e)
      }
   }
}