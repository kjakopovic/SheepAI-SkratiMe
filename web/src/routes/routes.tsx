import paths from '@/constants/paths';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';

const routes: Route[] = [
  {
    name: 'pages.login',
    path: paths.LOGIN,
    component: Login,
    isProtected: false,
  },
  {
    name: 'pages.Dashboard',
    path: paths.DASHBOARD,
    component: Dashboard,
    isProtected: false,
  },
];

export default routes;
