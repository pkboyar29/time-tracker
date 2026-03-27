import { IUserAudio } from '../model/userAudio.model';

export interface UserSignUpDTO {
  email: string;
  password: string;
  timezone: string;
}

export interface UserSignInDTO {
  email: string;
  password: string;
}

export interface UserResponseDTO {
  // firstName: string;
  // lastName: string;
  showTimerInTitle: boolean;
  email: string;
  createdDate: Date;
  dailyGoal: number;
  audios: IUserAudio[];
}
