import { FC } from 'react';
import Tooltip from './Tooltip';

interface QuestionMarkTooltipProps {
  tooltipText: string;
}

const QuestionMarkTooltip: FC<QuestionMarkTooltipProps> = ({ tooltipText }) => {
  return (
    <Tooltip<HTMLDivElement> tooltipText={tooltipText}>
      {(ref) => (
        <div
          ref={ref}
          className="flex items-center justify-center w-5 h-5 text-sm text-white rounded-full select-none bg-surfaceDarkHover"
        >
          ?
        </div>
      )}
    </Tooltip>
  );
};

export default QuestionMarkTooltip;
