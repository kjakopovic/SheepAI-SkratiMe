import paths from '@/constants/paths';
import Login from '@/pages/Login';

const routes: Route[] = [
  {
    name: 'pages.login',
    path: paths.LOGIN,
    component: Login,
    isProtected: false,
  },
];

export default routes;
