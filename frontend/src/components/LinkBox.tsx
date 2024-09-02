import { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';

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
      <svg fill="white" viewBox="0 0 16 16" className="w-6 h-6">
        <path
          fillRule="evenodd"
          d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z"
        />
      </svg>
    </Link>
  );
};

export default LinkBox;
