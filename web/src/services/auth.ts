import { Dispatch, SetStateAction } from 'react';

import paths from '@/constants/paths';
import { jwtDecode } from 'jwt-decode';

import { useUserContext } from '@/context/UserContext';

import { useFetchWrapper } from '@/hooks';

import { User } from '@/models/user';

import { LoginPayload, Token, TokenPayload, UserRegisterPayload } from '../types/auth';

export const useAuthServices = () => {
  const { post } = useFetchWrapper();
  const userContext = useUserContext();

  const login = (payload: LoginPayload) => post(paths.API.AUTH_LOGIN, { json: payload }) as Promise<Token>;

  const userRegister = (payload: UserRegisterPayload) =>
    post(paths.API.AUTH_USER_REGISTER, { json: payload }) as Promise<Token>;

  const refreshToken = (payload: TokenPayload) =>
    post(paths.API.AUTH_REFRESH_TOKEN, {
      json: payload,
    }) as Promise<Token>;

  const storeTokens = (tokens: Token) => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  };

  const storeAccessToken = (tokens: Token) => {
    localStorage.setItem('accessToken', tokens.accessToken);
  };

  const updateUserContext = (setUser: Dispatch<SetStateAction<User | null>>) => {
    const accessToken = localStorage.getItem('accessToken') || '';
    const refreshToken = localStorage.getItem('refreshToken') || '';
    const decodedUser: User = jwtDecode(accessToken);
    decodedUser.roles = JSON.parse(decodedUser.roles as string) as string[];

    setUser({ ...decodedUser, accessToken, refreshToken });
  };

  const logout = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    userContext?.setUser(null);
  };

  return {
    login,
    logout,
    userRegister,
    refreshToken,
    storeAccessToken,
    storeTokens,
    updateUserContext,
  };
};
