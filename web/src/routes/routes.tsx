import { paths } from '@/old-template/common/constants';

import { lazyImport } from '@/lib/lazyImport';

const { Login } = lazyImport(() => import('@/old-template/features/auth'), 'Login');
const { Dashboard } = lazyImport(() => import('@/old-template/features/dashboard'), 'Dashboard');

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
