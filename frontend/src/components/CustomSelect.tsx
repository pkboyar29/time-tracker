import { FC, useState, useRef, useEffect, useMemo } from 'react';
import CaretIcon from '../icons/CaretIcon';

interface Option {
  id: string;
  name: string;
}

interface OptionGroup {
  optGroupName: string; // you can pass empty string
  color: 'standart' | 'grey' | 'red';
  options: Option[];
}

interface CustomSelectProps {
  currentId: string;
  onChange: (newCurrentId: string) => void;
  optionGroups: OptionGroup[];
}

const CustomSelect: FC<CustomSelectProps> = ({
  currentId,
  onChange,
  optionGroups,
}) => {
  const [dropdown, setDropdown] = useState<boolean>(false);
  const customSelectRef = useRef<HTMLDivElement | null>(null);

  const allOptions = useMemo(
    () => optionGroups.flatMap((optGroup) => optGroup.options),
    [optionGroups]
  );
  const currentOption = useMemo(
    () => allOptions.find((o) => o.id === currentId),
    [currentId, allOptions]
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        customSelectRef.current &&
        !customSelectRef.current.contains(e.target as Node)
      ) {
        setDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      ref={customSelectRef}
      className={`relative w-full text-base bg-white rounded-lg select-none dark:text-textDark dark:bg-surfaceDarkHover`}
    >
      <div
        onClick={() => {
          setDropdown((dropdown) => !dropdown);
        }}
        className="flex justify-between gap-2 px-3 py-2 cursor-pointer"
      >
        <div className="w-10/12 truncate">{currentOption?.name}</div>

        <CaretIcon
          className={`transition-transform duration-300 ease-in-out ${
            dropdown ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </div>

      {dropdown && (
        <div
          className={`absolute z-[2000] top-full left-0 w-full px-3 py-2 rounded-lg bg-white dark:bg-surfaceDarkHover border border-solid border-gray-500 overflow-y-auto max-h-[500px] `}
        >
          {optionGroups
            .filter((optGroup) => optGroup.options.length > 0)
            .map((optGroup, i) => (
              <div key={i}>
                <div
                  className={`text-sm font-semibold ${
                    optGroup.color == 'red'
                      ? 'text-primary'
                      : optGroup.color == 'grey'
                      ? 'text-gray-500'
                      : 'dark:text-textDark'
                  }`}
                >
                  {optGroup.optGroupName}
                </div>

                <div className="flex flex-col">
                  {optGroup.options.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => {
                        onChange(option.id);
                        setDropdown(false);
                      }}
                      className={`py-1.5 pl-4 text-base transition duration-300 rounded-md hover:bg-surfaceLightHover dark:hover:bg-surfaceDark truncate ${
                        optGroup.color == 'red'
                          ? 'text-primary'
                          : optGroup.color == 'grey'
                          ? 'text-gray-500'
                          : 'dark:text-textDark'
                      }`}
                    >
                      {option.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
