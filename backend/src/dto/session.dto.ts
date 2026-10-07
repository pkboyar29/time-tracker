export interface SessionCreateDTO {
  totalSeconds: number;
  activity?: string;
}

export interface SessionUpdateDTO {
  totalSeconds: number;
  spentSeconds: number;
  note?: string;
  isPaused: boolean;
}
