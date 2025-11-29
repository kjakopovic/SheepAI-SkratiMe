import { useMutation } from '@tanstack/react-query';

import { ServerError } from '@/old-template/common/errors/ServerError';

import { useToast } from '@/hooks';

import { User } from '@/models/user';

import { LoginPayload, TokenPayload, UserRegisterPayload } from '../types';
import { useAuthServices } from './services';

export const useAuthActions = () => {
  const service = useAuthServices();
  const { showToast, ToastType } = useToast();

  const login = useMutation({
    mutationKey: ['login'],
    mutationFn: (payload: LoginPayload) => service.login(payload),
    onSuccess: (data) => service.storeTokens(data),
    onError: (error: ServerError) => showToast({ text: error.message, type: ToastType.ERROR }),
  });

  const userRegister = useMutation({
    mutationKey: ['userRegister'],
    mutationFn: (payload: UserRegisterPayload) => service.userRegister(payload),
    onSuccess: (data) => service.storeTokens(data),
    onError: (error: ServerError) => showToast({ text: error.message, type: ToastType.ERROR }),
  });

  const refreshAuthToken = useMutation({
    mutationKey: ['refreshToken'],
    mutationFn: (payload: TokenPayload) => service.refreshToken(payload),
    onSuccess: (data) => service.storeTokens(data),
    onError: (error: ServerError) => showToast({ text: error.message, type: ToastType.WARNING }),
  });

  const updateUserContext = (setUser: React.Dispatch<React.SetStateAction<User | null>>) =>
    service.updateUserContext(setUser);

  const logout = () => service.logout();

  return {
    login,
    logout,
    refreshAuthToken,
    updateUserContext,
    userRegister,
  };
};
