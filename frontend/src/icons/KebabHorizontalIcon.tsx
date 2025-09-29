import { FC } from 'react';

const KebabHorizontalIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      className={`size-6 stroke-black dark:stroke-textDark ${props.className}`}
    >
      <g clipPath="url(#clip0_105_1881)">
        <rect
          height="0.01"
          strokeLinejoin="round"
          strokeWidth="3"
          transform="rotate(90 12.01 12)"
          width="0.01"
          x="12.01"
          y="12"
        />

        <rect
          height="0.01"
          strokeLinejoin="round"
          strokeWidth="3"
          transform="rotate(90 19.01 12)"
          width="0.01"
          x="19.01"
          y="12"
        />

        <rect
          height="0.01"
          strokeLinejoin="round"
          strokeWidth="3"
          transform="rotate(90 5.01001 12)"
          width="0.01"
          x="5.01001"
          y="12"
        />
      </g>

      <defs>
        <clipPath id="clip0_105_1881">
          <rect
            fill="white"
            height="24"
            transform="translate(0 0.000976562)"
            width="24"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default KebabHorizontalIcon;
