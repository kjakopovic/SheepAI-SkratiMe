import { ReactElement, memo, useEffect, useMemo, useState } from 'react';

import { jwtDecode } from 'jwt-decode';

import { UserContext } from '@/context/UserContext';

import { useAuthActions } from '@/old-template/features/auth';

import { User } from '@/models/user';

const POLLING_DELAY = 600000; // 10 mins

interface InitProviderProps {
  children: ReactElement;
}

const InitProvider = ({ children }: InitProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const { refreshAuthToken, updateUserContext } = useAuthActions();

  useEffect(() => {
    let decodedUser: User = {} as User;
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken && !user) {
      decodedUser = jwtDecode(accessToken);
      decodedUser.roles = JSON.parse(decodedUser.roles as string) as string[];

      setUser({
        ...decodedUser,
        accessToken,
        refreshToken: refreshToken ?? '',
      });
    }

    const interval = setInterval(() => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (accessToken) {
        decodedUser = jwtDecode(accessToken);
        decodedUser.roles = JSON.parse(decodedUser.roles as string) as string[];

        const isTokenExpired = Date.now() + POLLING_DELAY >= decodedUser.exp * 1000;

        if (isTokenExpired && refreshToken && !refreshAuthToken.isPending) {
          void refreshAuthToken.mutateAsync({ token: refreshToken }).then(() => updateUserContext(setUser));
        } else if (user?.accessToken !== accessToken && refreshToken) {
          setUser({ ...decodedUser, accessToken, refreshToken });
        }
      }
    }, POLLING_DELAY);

    if (!accessToken) {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [refreshAuthToken, user, updateUserContext]);

  return <UserContext.Provider value={useMemo(() => ({ user, setUser }), [user])}>{children}</UserContext.Provider>;
};

export default memo(InitProvider);
