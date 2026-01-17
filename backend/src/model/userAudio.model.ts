import { Types, Schema, model } from 'mongoose';

export interface IUserAudio {
  _id: Types.ObjectId;
  audioName: string;
  audioPath: string;
  createdDate: Date;
  current: boolean;
}

const userAudioSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  audioName: {
    type: String,
    required: true,
  },
  audioPath: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
    required: true,
  },
  current: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const UserAudio = model('UserAudio', userAudioSchema, 'user_audios');

export default UserAudio;
