import useAuthorization from '@/hooks/useAuthorization';

import { RoleTypes } from '../../constants';

type Props = {
  forbiddenFallback?: React.ReactNode;
  children: React.ReactNode;
} & (
  | {
      allowedRoles: RoleTypes[];
      policyCheck?: boolean;
    }
  | {
      allowedRoles?: never;
      policyCheck: boolean;
    }
);

export const Authorization = ({ policyCheck, allowedRoles, forbiddenFallback = null, children }: Props) => {
  const { checkAccess } = useAuthorization();

  let canAccess = false;

  if (allowedRoles) {
    canAccess = checkAccess({ allowedRoles });
  }

  if (typeof policyCheck !== 'undefined') {
    canAccess = policyCheck;
  }

  return canAccess ? children : forbiddenFallback;
};
