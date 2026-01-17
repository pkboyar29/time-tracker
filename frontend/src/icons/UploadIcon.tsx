import { FC } from 'react';

const UploadIcon: FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="1.5"
      // TODO: className ниже и className из пропсов не объединяются
      className={`size-5 stroke-black dark:stroke-textDark`}
      {...props}
    >
      <path
        d="M5 12V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15L12 3M12 3L8 7M12 3L16 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default UploadIcon;
