import { FC } from 'react';

const CaretIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      {...props}
      viewBox="0 0 20 23"
      fill="none"
      className={`size-6 stroke-black dark:stroke-textDark ${props.className}`}
    >
      <g>
        <path
          d="M16 10L12 14L8 10"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default CaretIcon;
