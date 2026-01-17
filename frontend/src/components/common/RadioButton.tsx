import { FC } from 'react';

interface RadioButtonProps {
  isChecked: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

const RadioButton: FC<RadioButtonProps> = ({
  isChecked,
  onSelect,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`
        w-5 h-5 flex items-center justify-center rounded-full
        border border-solid transition-colors duration-200
        ${isChecked ? 'border-primary' : 'border-primary/50'}
        ${
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:border-primary dark:hover:border-primary'
        }
      `}
    >
      <div
        className={`
          w-2.5 h-2.5 rounded-full transition-all duration-200
          ${isChecked ? 'bg-primary scale-100' : 'bg-transparent scale-0'}
        `}
      />
    </button>
  );
};

export default RadioButton;
