import { CircularProgress, Box, Typography } from '@mui/material';
import { FC } from 'react';

interface CustomCircularProgressProps {
  value: number;
  label: string;
}

const CustomCircularProgress: FC<CustomCircularProgressProps> = ({
  value,
  label,
}) => {
  return (
    <Box sx={{ position: 'relative' }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
        }}
        size={140}
        thickness={4}
        value={100}
      />

      <CircularProgress
        sx={{
          color: (theme) =>
            theme.palette.mode === 'light' ? '#ef4444' : '#ef4444',
          position: 'absolute',
          left: 0,
        }}
        size={140}
        thickness={4}
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
        <Typography variant="h6" component="div">
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomCircularProgress;
