export interface User {
  id: number;
  email: string;
  name: string;
  iat: number;
  exp: number;
  accessToken: string;
  refreshToken: string;
  organizationId: string;
  roles: string[] | string;
}

export interface UserContextData {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
