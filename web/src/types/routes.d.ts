import { ComponentType } from 'react';

import { RoleTypes } from '@/old-template/features/auth';

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
