import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset' | undefined;
}

const Button: FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  ...otherProps
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className="p-3 text-white transition duration-300 bg-red-500 hover:bg-red-700 rounded-xl"
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default Button;
