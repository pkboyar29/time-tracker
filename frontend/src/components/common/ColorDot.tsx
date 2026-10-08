import { FC } from 'react';

interface ColorDotProps {
  color: string;
}

const ColorDot: FC<ColorDotProps> = ({ color }) => {
  return <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />;
};

export default ColorDot;
