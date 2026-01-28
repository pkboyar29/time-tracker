import { FC } from 'react';
import { colors } from '../../../design-tokens';
import { useAppSelector } from '../../redux/store';

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
  const percentage = ((currentValue - minValue) / (maxValue - minValue)) * 100;

  const themeState = useAppSelector((state) => state.theme.theme);

  return (
    <input
      type="range"
      min={minValue}
      max={maxValue}
      value={currentValue}
      onChange={(e) => changeCurrentValue(Number(e.target.value))}
      style={{
        background: `linear-gradient(to right, ${
          colors.primary
        } ${percentage}%, ${
          themeState === 'dark' ? '#333' : '#fff'
        } ${percentage}%)`,
      }}
      className="w-full h-[8px] appearance-none rounded-full cursor-pointer range-slider-custom"
    />
  );
};

export default RangeSlider;
