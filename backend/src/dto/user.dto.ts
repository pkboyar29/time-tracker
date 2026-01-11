import { IUserAudio } from '../model/userAudio.model';
import { SessionStatistics } from './analytics.dto';

export interface UserSignUpDTO {
  email: string;
  password: string;
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
  todayAnalytics: SessionStatistics;
  audios: IUserAudio[];
}
