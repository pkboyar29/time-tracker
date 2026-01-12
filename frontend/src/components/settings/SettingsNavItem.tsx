import { FC } from 'react';

interface SettingsNavItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SettingsNavItem: FC<SettingsNavItemProps> = ({
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`
    w-[65px] sm:w-auto text-center sm:text-left
    px-3 py-2 rounded-md text-sm transition-colors
    text-black/70
    hover:bg-black/5 hover:text-black
    dark:text-white/60
    dark:hover:bg-white/5 dark:hover:text-white
    ${
      isActive
        ? `bg-black/10 text-black
          dark:bg-white/10 dark:text-white`
        : ''
    }
  `}
    >
      {label}
    </button>
  );
};

export default SettingsNavItem;
