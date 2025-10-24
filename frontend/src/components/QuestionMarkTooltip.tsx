import { FC, useState } from 'react';

interface QuestionMarkTooltipProps {
  tooltipText: string;
}

const QuestionMarkTooltip: FC<QuestionMarkTooltipProps> = ({ tooltipText }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="flex items-center justify-center w-5 h-5 text-sm text-white rounded-full select-none bg-surfaceDarkHover">
        ?
      </div>

      {isVisible && (
        <div className="absolute z-10 max-w-xs px-2 py-1 mb-2 text-sm text-gray-200 -translate-x-1/2 rounded-md shadow-lg bottom-full left-1/2 w-max bg-surfaceDarkDarker">
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default QuestionMarkTooltip;
