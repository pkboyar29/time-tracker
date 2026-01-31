import { FC } from 'react';

interface ToggleButtonProps {
  isChecked: boolean;
  setIsChecked: (isChecked: boolean) => void;
  uncheckedVariant?: 'default' | 'danger';
}

const ToggleButton: FC<ToggleButtonProps> = ({
  isChecked,
  setIsChecked,
  uncheckedVariant = 'default',
}) => {
  const uncheckedBgMap = {
    default: 'bg-surfaceLightHover dark:bg-surfaceDarkHover',
    danger: 'bg-[#E5E7EB] dark:bg-surfaceDarkHover',
  };

  return (
    <button
      onClick={() => setIsChecked(!isChecked)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
        isChecked ? 'bg-primary' : uncheckedBgMap[uncheckedVariant]
      }`}
    >
      <div
        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
          isChecked ? 'translate-x-6' : 'translate-x-0'
        }`}
      ></div>
    </button>
  );
};

export default ToggleButton;
