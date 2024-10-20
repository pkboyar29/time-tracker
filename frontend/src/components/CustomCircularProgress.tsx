import { CircularProgress, Box, Typography } from '@mui/material';
import { FC } from 'react';

interface CustomCircularProgressProps {
  valuePercent: number; // from 0 to 100 percent
  label: string;
  size?: 'small' | 'big' | 'verybig';
}

const CustomCircularProgress: FC<CustomCircularProgressProps> = ({
  valuePercent: value,
  label,
  size = 'small',
}) => {
  const getSize = () => {
    switch (size) {
      case 'verybig':
        return 200;
      case 'big':
        return 140;
      default:
        return 60;
    }
  };

  const circleSize = getSize();

  return (
    <Box sx={{ position: 'relative', width: circleSize, height: circleSize }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
        }}
        size={circleSize}
        thickness={size === 'big' || size === 'verybig' ? 4 : 2}
        value={100}
      />

      <CircularProgress
        sx={{
          color: (theme) =>
            theme.palette.mode === 'light' ? '#ef4444' : '#ef4444',
          position: 'absolute',
          left: 0,
        }}
        size={circleSize}
        thickness={size === 'big' || size === 'verybig' ? 4 : 2}
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
        <Typography
          variant={size === 'big' || size === 'verybig' ? 'h6' : 'inherit'}
          component="div"
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomCircularProgress;
