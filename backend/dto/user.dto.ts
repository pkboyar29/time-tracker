export interface UserSignUpDTO {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

export interface UserSignInDTO {
  username: string;
  password: string;
}
