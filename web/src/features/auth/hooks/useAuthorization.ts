import { useCallback } from 'react';

import { useUserContext } from '@/context/UserContext';

import { RoleTypes } from '../constants';

const useAuthorization = () => {
  const userContext = useUserContext();
  // currently user can have only 1 role, when this changes we need to update this logic
  const userRole: RoleTypes | null = userContext?.user?.roles ? (userContext?.user?.roles[0] as RoleTypes) : null;

  if (!userContext?.user || !userRole) {
    throw Error('User does not exist or has no role set!');
  }

  const checkAccess = useCallback(
    ({ allowedRoles }: { allowedRoles: RoleTypes[] }) => {
      if (allowedRoles && allowedRoles.length > 0) {
        return allowedRoles?.includes(userRole);
      }

      return true;
    },
    [userRole],
  );

  return { checkAccess, role: userRole };
};

export default useAuthorization;
