export interface SessionCreateDTO {
  totalTimeSeconds: number;
  activity?: string;
}

export interface SessionUpdateDTO {
  totalTimeSeconds: number;
  spentTimeSeconds: number;
  note?: string;
}
