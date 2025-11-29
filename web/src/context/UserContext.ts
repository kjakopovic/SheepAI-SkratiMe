import { createContext, useContext } from 'react';

import { UserContextData } from '@/models/user';

export const UserContext = createContext<UserContextData | null>({
  user: null,
  setUser: () => null,
});

export const useUserContext = () => useContext(UserContext);
