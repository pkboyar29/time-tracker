import {
  ReactNode,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  FC,
} from 'react';
import { isOutOfRightBoundary } from '../../helpers/htmlHelpers';

interface DropdownMenuProps {
  children: ReactNode;
  dropdown: boolean;
  setDropdown: (dropdown: boolean) => void;
}

const DropdownMenu: FC<DropdownMenuProps> = ({
  children,
  dropdown,
  setDropdown,
}) => {
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isOnLeft, setIsOnLeft] = useState<boolean>(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    if (dropdownRef.current) {
      if (isOutOfRightBoundary(dropdownRef.current)) {
        setIsOnLeft(true);
      } else {
        setIsOnLeft(false);
      }
    }
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`${
        dropdown
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      } ${
        isOnLeft ? 'right-0' : 'left-0'
      } rounded-lg absolute top-full z-50 p-1 border border-solid bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500 shadow-2xl`}
    >
      {children}
    </div>
  );
};

export default DropdownMenu;
