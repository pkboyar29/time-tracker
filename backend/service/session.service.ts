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
         console.log(`id сессии в сервисе это ${sessionId}`)
         await Session.findById(sessionId).updateOne({
            totalTimeSeconds: sessionDTO.totalTimeSeconds,
            spentTimeSeconds: sessionDTO.spentTimeSeconds,
            completed: completed
         })

         return await Session.findById(sessionId)
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