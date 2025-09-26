import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  clickHandler?: () => void;
  type?: 'button' | 'submit' | 'reset' | undefined;
}

const Button: FC<ButtonProps> = ({
  children,
  clickHandler,
  type = 'button',
  className = '',
  ...otherProps
}) => {
  return (
    <button
      type={type}
      onClick={clickHandler}
      className={`
        cursor-pointer
        text-[14.5px] font-medium tracking-wide
        px-4 py-2.5 w-full
        text-white dark:text-textDark
        bg-primary hover:bg-primaryHover
        rounded-2xl shadow-sm hover:shadow-md
        transition duration-300 ease-in-out
        ${className}
      `}
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default Button;
