import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import paths from '@/constants/paths';
import { Onboarding } from '@/pages/Onboarding';

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
  {
    name: 'pages.register',
    path: paths.REGISTER,
    component: Register,
    isProtected: false,
  },
  {
    name: 'pages.onboarding',
    path: paths.ONBOARDING,
    component: Onboarding,
    isProtected: false,
  }
];

export default routes;
