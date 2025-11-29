import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Wrapper from '@/components/Wrapper';

import routes from './routes';

export const Router = () => (
  <BrowserRouter>
    <Wrapper.ErrorBoundary>
      <Wrapper.InitProvider>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              id={route.name}
              path={route.path}
              element={
                <Wrapper.Route
                  component={route.component}
                  name={route.name}
                  isProtected={route.isProtected}
                  allowedRoles={route.allowedRoles}
                />
              }
            />
          ))}
          <Route
            path="*"
            element={<Wrapper.Route component={() => <h1>Page not found</h1>} name="" isProtected={false} />}
          />
        </Routes>
      </Wrapper.InitProvider>
    </Wrapper.ErrorBoundary>
  </BrowserRouter>
);

export default Router;
