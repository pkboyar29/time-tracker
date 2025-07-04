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
      className="flex items-center justify-between gap-10 px-8 py-5 transition duration-300 bg-red-500 cursor-pointer hover:bg-red-700 rounded-2xl"
    >
      <div className="text-xl font-bold text-white">{children}</div>
      <RightArrowIcon />
    </Link>
  );
};

export default LinkBox;
