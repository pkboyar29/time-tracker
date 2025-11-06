import { FC } from 'react';

const StopIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="size-6 stroke-black dark:stroke-textDark"
      {...props}
    >
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="2"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default StopIcon;
