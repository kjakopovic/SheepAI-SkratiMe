import paths from '@/constants/paths';

import Login from '@/components/auth/Login';

const routes: Route[] = [
  {
    name: 'pages.login',
    path: paths.LOGIN,
    component: Login,
    isProtected: false,
  },
];

export default routes;
