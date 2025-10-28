import { FC } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/store';
import { setIsSidebarOpen } from '../redux/slices/windowSlice';

import BurgerIcon from '../icons/BurgerIcon';

const BurgerButton: FC = () => {
  const dispatch = useAppDispatch();
  const isSidebarOpen = useAppSelector((state) => state.window.isSidebarOpen);

  return (
    <div
      className={`absolute z-30 block md:hidden top-4 left-4 transition duration-200 ease-in-out ${
        isSidebarOpen ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <button
        className="flex items-center justify-center w-12 h-12 transition-all duration-300 border shadow-lg rounded-2xl bg-backgroundLight dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:border-zinc-700 shadow-black/30 backdrop-blur-sm active:scale-95"
        aria-label="Open sidebar"
        onClick={(e) => {
          e.stopPropagation();
          dispatch(setIsSidebarOpen(true));
        }}
      >
        <BurgerIcon />
      </button>
    </div>
  );
};

export default BurgerButton;
