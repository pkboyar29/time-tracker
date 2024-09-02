import { FC, ReactNode } from 'react';

interface TitleProps {
  children: ReactNode;
}

const Title: FC<TitleProps> = ({ children }) => {
  return <div className="text-xl font-bold">{children}</div>;
};

export default Title;
