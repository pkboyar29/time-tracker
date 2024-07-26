export interface SessionDTO {
  totalTimeSeconds: number;
  spentTimeSeconds: number;
  activity?: string;
}

export interface SessionUpdateDTO {
  totalTimeSeconds: number;
  spentTimeSeconds: number;
}
