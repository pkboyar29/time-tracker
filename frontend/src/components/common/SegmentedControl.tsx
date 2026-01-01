import { FC } from 'react';

interface SegmentedOption {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
}

const SegmentedControl: FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <div
      role="radiogroup"
      className="inline-flex items-center gap-1 p-1 rounded-full  bg-backgroundLight dark:bg-surfaceDark"
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            onClick={() => !active && onChange(option.value)}
            className={`
              px-4 py-1.5 rounded-full text-sm font-medium
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
              ${
                active
                  ? `
                    bg-primary text-white
                    hover:bg-primaryHover
                  `
                  : `
                    text-gray-700 hover:bg-black/5
                    dark:text-textDarkSecondary dark:hover:bg-white/10
                  `
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
