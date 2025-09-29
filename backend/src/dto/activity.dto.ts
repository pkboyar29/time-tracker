export interface ActivityCreateDTO {
  name: string;
  descr?: string;
  activityGroupId: string;
}

export interface ActivityUpdateDTO {
  name: string;
  descr?: string;
}

export interface ActivityUpdateArchivedDTO {
  archived: boolean;
}
