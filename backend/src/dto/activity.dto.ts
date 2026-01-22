export interface ActivityCreateDTO {
  name: string;
  color: string;
  descr?: string;
  activityGroupId: string;
}

export interface ActivityUpdateDTO {
  name: string;
  descr?: string;
}
