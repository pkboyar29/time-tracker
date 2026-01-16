import { FC } from 'react';

const PlayIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={`size-6 stroke-black dark:stroke-textDark ${props.className}`}
    >
      <path
        d="M7 4.5 L19 12 L7 19.5 Z"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PlayIcon;
