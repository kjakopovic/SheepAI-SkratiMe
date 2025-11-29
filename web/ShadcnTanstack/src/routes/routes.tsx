import { paths } from '@/common/constants';

import { lazyImport } from '@/utils/lazyImport';

const { Login } = lazyImport(() => import('@/features/auth'), 'Login');
const { Dashboard } = lazyImport(() => import('@/features/dashboard'), 'Dashboard');

const routes: Route[] = [
  {
    name: 'pages.login',
    path: paths.LOGIN,
    component: Login,
    isProtected: false,
  },
  {
    name: 'pages.dashboard',
    path: paths.DASHBOARD,
    component: Dashboard,
    isProtected: true,
  },
];

export default routes;
