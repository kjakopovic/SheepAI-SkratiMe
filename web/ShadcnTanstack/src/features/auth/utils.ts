import { ROLES } from './constants';

const isSubsidiaryAdmin = (userRoles: string[]) => {
  return userRoles.includes(ROLES.SUBSIDIARY_ADMIN);
};

const isOrganizationAdmin = (userRoles: string[]) => {
  return userRoles.includes(ROLES.ORGANIZATION_ADMIN);
};

export { isOrganizationAdmin, isSubsidiaryAdmin };
