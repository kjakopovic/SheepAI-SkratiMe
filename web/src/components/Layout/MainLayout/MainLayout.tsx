import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

const MainLayout = ({ children }: Props) => {
  return (
    <div>
      <div>{children}</div>
    </div>
  );
};

export default MainLayout;
