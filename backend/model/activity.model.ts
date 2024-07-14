import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
   name: {
      type: String,
      required: true
   },
   descr: {
      type: String,
      required: false
   },
   createdDate: {
      type: Date,
      default: Date.now(),
      required: true
   },
   updatedDate: {
      type: Date,
      default: Date.now(),
      required: true
   }
})

const Activity = mongoose.model('Activity', activitySchema, 'activities')

export default Activity