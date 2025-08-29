export interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  dailyGoal: number;
  showTimerInTitle: boolean;
}

export interface ISignIn {
  username: string;
  password: string;
}

export interface ISignUp {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}
