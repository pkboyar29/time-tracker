export interface UserSignUpDTO {
  email: string;
  username: string;
  password: string;
}

export interface UserSignInDTO {
  username: string;
  password: string;
}

export interface UserResponseDTO {
  username: string;
  firstName: string;
  lastName: string;
  showTimerInTitle: boolean;
  email: string;
}
