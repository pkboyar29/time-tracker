export interface SessionDTO {
  totalTimeSeconds: number;
  activity?: string;
}

export interface SessionUpdateDTO {
  totalTimeSeconds: number;
  spentTimeSeconds: number;
}
