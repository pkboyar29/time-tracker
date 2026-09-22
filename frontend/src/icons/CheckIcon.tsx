import { FC } from 'react';

const CheckIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={`size-6 stroke-black dark:stroke-textDark ${props.className}`}
    >
      <path
        d="M4 12.6111L8.92308 17.5L20 6.5"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default CheckIcon;
