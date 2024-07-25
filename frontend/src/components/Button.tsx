import { FC, ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
}

const Button: FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <button onClick={onClick} className="p-3 text-white bg-red-500 rounded-xl">
      {children}
    </button>
  );
};

export default Button;
