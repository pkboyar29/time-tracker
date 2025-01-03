import { FC } from 'react';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  currentValue: number;
  changeCurrentValue: (newCurrentValue: number) => void;
}

const RangeSlider: FC<RangeSliderProps> = ({
  minValue,
  maxValue,
  currentValue,
  changeCurrentValue,
}) => {
  return (
    <input
      type="range"
      min={minValue}
      max={maxValue}
      value={currentValue}
      onChange={(e) => changeCurrentValue(Number(e.target.value))}
      className="w-full transition-opacity duration-300 ease-in-out bg-red-500 appearance-none rounded-xl opacity-70 hover:opacity-100 range"
    />
  );
};

export default RangeSlider;
