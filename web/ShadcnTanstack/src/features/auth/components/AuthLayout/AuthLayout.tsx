import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  return <div className="min-h-screen flex justify-center items-center">{children}</div>;
};

export default AuthLayout;
