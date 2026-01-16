export interface IUser {
  // firstName: string;
  // lastName: string;
  email: string;
  todaySpentTimeSeconds: number;
  dailyGoal: number;
  dailyGoalCompletionNotified: boolean;
  showTimerInTitle: boolean;
  createdDate: Date;
  audios: IUserAudio[];
}

export interface IUserAudio {
  id: string;
  audioName: string;
  url: string;
  current: boolean;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface ISignUp {
  email: string;
  password: string;
}
