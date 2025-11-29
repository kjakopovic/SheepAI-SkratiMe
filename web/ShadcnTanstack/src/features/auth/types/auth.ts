export interface Token {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserRegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  companyName: string;
}

export interface TokenPayload {
  token: string;
}
