export default {
  DASHBOARD: '/',

  LOGIN: '/login',

  API: {
    AUTH_LOGIN: 'api/login',
  },

  build: (path: string, ...params: string[]): string => path.replace(/(:\w+)/g, () => params.shift() || ''),
} as Paths;
