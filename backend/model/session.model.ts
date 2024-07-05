import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
   totalTimeSeconds: { type: Number, required: true },
   spentTimeSeconds: { type: Number, required: true },
   completed: { type: Boolean, default: false, required: true }
})

const Session = mongoose.model('Session', sessionSchema, 'sessions')

export default Session