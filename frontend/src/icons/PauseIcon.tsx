import { FC } from 'react';

const PauseIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="size-6 stroke-black dark:stroke-textDark"
      {...props}
    >
      <path
        d="M8 5 L8 19 M16 5 L16 19"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PauseIcon;
