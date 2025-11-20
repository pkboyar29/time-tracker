export interface IUser {
  // firstName: string;
  // lastName: string;
  email: string;
  dailyGoal: number;
  showTimerInTitle: boolean;
  createdDate: Date;
}

export interface ISignIn {
  email: string;
  password: string;
}

export interface ISignUp {
  email: string;
  password: string;
}
