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
         const existingSession = Session.findById(sessionId)

         const output = await existingSession.updateOne({
            totalTimeSeconds: sessionDTO.totalTimeSeconds,
            spentTimeSeconds: sessionDTO.spentTimeSeconds,
            completed: completed
         })

         return await output
      } catch (e) {
         console.log(e)
      }
   },

   async getSessions() {
      try {
         const sessions = Session.find({})
         console.log('All sessions: ', sessions)
         return await sessions
      } catch (e) {
         console.log(e)
      }
   }

}