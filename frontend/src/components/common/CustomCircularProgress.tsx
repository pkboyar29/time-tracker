import { FC, useMemo } from 'react';
import { colors } from '../../../design-tokens';
import { getThemeFromLS } from '../../helpers/localstorageHelpers';

import { CircularProgress, Box } from '@mui/material';

type CircularSize = 'small' | 'big' | 'verybig';

interface CustomCircularProgressProps {
  valuePercent: number; // from 0 to 100
  label: string;
  size?: CircularSize;
}

const getSize = (size: CircularSize) => {
  switch (size) {
    case 'verybig':
      return 240;
    case 'big':
      return 200;
    default:
      return 65;
  }
};

const CustomCircularProgress: FC<CustomCircularProgressProps> = ({
  valuePercent: value,
  label,
  size = 'small',
}) => {
  const circleSize = useMemo(() => getSize(size), [size]);
  const circleThinkness = useMemo(
    () => (size === 'big' ? 4 : size == 'verybig' ? 2.5 : 2),
    [size]
  );
  const labelClassnames = useMemo(
    () =>
      size === 'big'
        ? 'text-[18px] font-medium text-center'
        : size == 'verybig'
        ? 'text-[24px] font-medium text-center'
        : 'text-[12px] font-medium text-center',
    [size]
  );

  return (
    <Box sx={{ position: 'relative', width: circleSize, height: circleSize }}>
      <CircularProgress
        variant="determinate"
        className="text-[#eeeeee] dark:text-[#424242]"
        sx={{
          // 800 если темный
          color: (theme) =>
            getThemeFromLS() === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
        }}
        size={circleSize}
        thickness={circleThinkness}
        value={100}
      />

      <CircularProgress
        sx={{
          color: () => colors.primary,
          position: 'absolute',
          left: 0,
        }}
        size={circleSize}
        thickness={circleThinkness}
        variant="determinate"
        value={value}
      />

      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        <div className={`${labelClassnames} dark:text-textDark`}>{label}</div>
      </Box>
    </Box>
  );
};

export default CustomCircularProgress;
