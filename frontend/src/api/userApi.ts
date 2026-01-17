import axios from './axios';

import {
  ISignIn,
  ISignUp,
  IUser,
  IUserAudio,
} from '../ts/interfaces/User/IUser';

const mapUserAudio = (unmappedUserAudio: any, blob: Blob): IUserAudio => {
  return {
    id: unmappedUserAudio._id,
    audioName: unmappedUserAudio.audioName,
    url: URL.createObjectURL(blob),
    current: unmappedUserAudio.current,
  };
};

export const signIn = async (
  payload: ISignIn
): Promise<{ access: string; refresh: string }> => {
  const { data } = await axios.post('/users/sign-in', payload);

  return data;
};

export const signUp = async (
  payload: ISignUp
): Promise<{ access: string; refresh: string }> => {
  const { data } = await axios.post('/users/sign-up', payload);

  return data;
};

export const fetchProfileInfo = async (): Promise<IUser> => {
  const { data } = await axios.get(
    `/users/profile?tz=${Intl.DateTimeFormat().resolvedOptions().timeZone}`
  );

  const audios: IUserAudio[] = await Promise.all(
    data.audios.map(async (a: any) => {
      const { data: blob } = await axios.get(`users/audio/${a._id}`, {
        responseType: 'blob',
      });

      return mapUserAudio(a, blob);
    })
  );

  return {
    ...data,
    createdDate: new Date(data.createdDate),
    todaySpentTimeSeconds: data.todayAnalytics.spentTimeSeconds,
    dailyGoalCompletionNotified:
      data.todayAnalytics.spentTimeSeconds >= data.dailyGoal,
    audios,
  };
};

export const updateDailyGoal = async (
  newDailyGoal: number
): Promise<string> => {
  const { data } = await axios.put('/users/updateDailyGoal', { newDailyGoal });

  return data;
};

export const updateShowTimerInTitle = async (
  showTimerInTitle: boolean
): Promise<string> => {
  const { data } = await axios.put('/users/updateShowTimerInTitle', {
    showTimerInTitle,
  });

  return data;
};

export const uploadAudio = async (audioFile: Blob): Promise<IUserAudio> => {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const { data: unmappedUserAudio } = await axios.post(
    'users/audio/uploadAudio',
    formData
  );

  return mapUserAudio(unmappedUserAudio, audioFile);
};

export const deleteAudio = async (audioId: string): Promise<string> => {
  const { data } = await axios.delete(`users/audio/${audioId}`);

  return data;
};

export const updateAudio = async (
  audioId: string,
  current: boolean
): Promise<string> => {
  const { data } = await axios.put(`users/audio/${audioId}`, { current });

  return data;
};
