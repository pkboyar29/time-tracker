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
    <>
      <button
        type={type}
        onClick={clickHandler}
        className={`cursor-pointer text-[14px] p-3 w-full text-white transition duration-300 bg-primary hover:bg-primary-hover rounded-xl ${className}`}
        {...otherProps}
      >
        {children}
      </button>
    </>
  );
};

export default Button;
