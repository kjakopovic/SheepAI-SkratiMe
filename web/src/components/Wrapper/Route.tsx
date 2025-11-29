import { memo, useCallback, useEffect, useMemo } from 'react';

import paths from '@/constants/paths';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

import { useUserContext } from '@/context/UserContext';

import { Authorization } from './Authorization';

const Route = ({
  component: Component,
  name,
  isProtected,
  allowedRoles = [],
}: Pick<Route, 'name' | 'component' | 'hideMenu' | 'isProtected' | 'allowedRoles'>) => {
  const { t } = useTranslation();
  const userContext = useUserContext();

  const isAuthenticated: boolean = useMemo(
    () => !!localStorage.getItem('accessToken') && !!userContext?.user,
    [userContext?.user],
  );

  const getComponent = useCallback(
    () =>
      isProtected ? (
        <Authorization allowedRoles={allowedRoles} forbiddenFallback={<div>Access denied</div>}>
          <Component />
        </Authorization>
      ) : (
        <Component />
      ),
    [isProtected, allowedRoles, Component],
  );

  useEffect(() => {
    document.title = t(name) || 'Company';
  }, [name, t]);

  if (!isProtected) {
    return getComponent();
  }

  if (!userContext?.user && localStorage.getItem('accessToken')) {
    return <div>Loading overlay</div>;
  }

  return isAuthenticated ? getComponent() : <Navigate to={{ pathname: paths.LOGIN }} />;
};

export default memo(Route);
