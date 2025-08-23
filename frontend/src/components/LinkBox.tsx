import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import RightArrowIcon from '../icons/RightArrowIcon';

interface LinkBoxProps {
  link: string;
  children: ReactNode;
}

const LinkBox: FC<LinkBoxProps> = ({ children, link }) => {
  return (
    <Link
      to={link}
      className="flex items-center justify-between gap-10 py-3.5 transition duration-300 bg-primary cursor-pointer px-7 hover:bg-primary-hover rounded-2xl"
    >
      <div className="text-xl font-bold text-white">{children}</div>
      <RightArrowIcon />
    </Link>
  );
};

export default LinkBox;
