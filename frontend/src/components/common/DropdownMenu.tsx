import { ReactNode, forwardRef } from 'react';

interface DropdownMenuProps {
  children: ReactNode;
}

// TODO: логика по отображению снизу либо слева либо справа (либо left-0 либо right-0)

const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ children }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg absolute top-full left-0 z-50 p-1 border border-solid bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500 shadow-2xl`}
      >
        {children}
      </div>
    );
  }
);

export default DropdownMenu;
