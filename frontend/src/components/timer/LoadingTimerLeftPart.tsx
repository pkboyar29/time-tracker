import { FC } from 'react';
import CustomCircularProgress from '../common/CustomCircularProgress';

const LoadingTimerLeftPart: FC = () => {
  return (
    <div className="animate-pulse">
      <CustomCircularProgress valuePercent={0} label="" size="verybig" />
    </div>
  );
};

export default LoadingTimerLeftPart;
