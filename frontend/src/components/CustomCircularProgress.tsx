import { CircularProgress, Box, Typography } from '@mui/material';
import { FC } from 'react';

interface CustomCircularProgressProps {
  value: number;
  label: string;
  size?: 'small' | 'big';
}

const CustomCircularProgress: FC<CustomCircularProgressProps> = ({
  value,
  label,
  size = 'small',
}) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
        }}
        size={size === 'big' ? 140 : 60}
        thickness={size === 'big' ? 4 : 2}
        value={100}
      />

      <CircularProgress
        sx={{
          color: (theme) =>
            theme.palette.mode === 'light' ? '#ef4444' : '#ef4444',
          position: 'absolute',
          left: 0,
        }}
        size={size === 'big' ? 140 : 60}
        thickness={size === 'big' ? 4 : 2}
        variant="determinate"
        value={value}
      ></CircularProgress>

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
        }}
      >
        <Typography variant={size === 'big' ? 'h6' : 'inherit'} component="div">
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomCircularProgress;
