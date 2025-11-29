import { ComponentType } from 'react';

import { RoleTypes } from '@/constants';

export {};

declare global {
  interface Route {
    name: string;
    path: string;
    component: ComponentType<any>;
    hideMenu?: boolean;
    isProtected: boolean;
    allowedRoles?: RoleTypes[];
  }
}
