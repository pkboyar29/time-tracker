import { FC } from 'react';

const RightChevronIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      {...props}
      viewBox="0 0 16 16"
      className={`w-5 h-5 fill-black dark:fill-textDarkSecondary`}
    >
      <path
        fillRule="evenodd"
        d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"
      />
    </svg>
  );
};

export default RightChevronIcon;
