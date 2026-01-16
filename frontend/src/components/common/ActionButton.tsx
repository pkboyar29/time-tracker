import { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  clickHandler?: () => void;
  type?: 'button' | 'submit' | 'reset' | undefined;
}

const ActionButton: FC<ActionButtonProps> = ({
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
      className={`px-2 py-1.5 rounded-md border border-primary/60 text-primary disabled:opacity-50 hover:bg-primary/10 ${className}`}
      {...otherProps}
    >
      {children}
    </button>
  );
};

export default ActionButton;
