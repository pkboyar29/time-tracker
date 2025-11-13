import {
  ReactNode,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  FC,
} from 'react';

interface DropdownMenuProps {
  children: ReactNode;
  dropdown: boolean;
  setDropdown: (dropdown: boolean) => void;
}

function isOutOfRightBoundary(elem: HTMLDivElement) {
  const elemRect = elem.getBoundingClientRect();
  const rootRect = document.getElementById('root')!.getBoundingClientRect();
  return elemRect.x + elemRect.width > rootRect.width;
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
      className={`${dropdown ? 'opacity-100' : 'opacity-0'} ${
        isOnLeft ? 'right-0' : 'left-0'
      } rounded-lg absolute top-full z-50 p-1 border border-solid bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500 shadow-2xl`}
    >
      {children}
    </div>
  );
};

export default DropdownMenu;
