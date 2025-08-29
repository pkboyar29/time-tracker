import { FC } from 'react';

interface ToggleButtonProps {
  isChecked: boolean;
  setIsChecked: (isChecked: boolean) => void;
}

const ToggleButton: FC<ToggleButtonProps> = ({ isChecked, setIsChecked }) => {
  return (
    <button
      onClick={() => setIsChecked(!isChecked)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
        isChecked ? 'bg-primary' : 'bg-[#F1F1F1]'
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
