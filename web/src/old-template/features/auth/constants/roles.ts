export enum ROLES {
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  SUBSIDIARY_ADMIN = 'SUBSIDIARY_ADMIN',
}

export type RoleTypes = keyof typeof ROLES;
