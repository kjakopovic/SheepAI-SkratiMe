export default {
  DASHBOARD: '/',

  LOGIN: '/login',
  SIGN_UP: '/sign-up',

  API: {
    AUTH_LOGIN: 'api/login',
    AUTH_MAGIC_LINK_REQUEST: 'auth/magic-link/request',
    AUTH_USER_REGISTER: '/auth/register',
  },

  build: (path: string, ...params: string[]): string => path.replace(/(:\w+)/g, () => params.shift() || ''),
} as Paths;
