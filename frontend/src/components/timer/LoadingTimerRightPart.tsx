import { FC } from 'react';

const Skeleton = ({ className }: { className: string }) => (
  <div
    className={`animate-pulse bg-gray-300 dark:bg-surfaceDarkHover rounded ${className}`}
  />
);

const LoadingTimerRightPart: FC = () => {
  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Session title */}
        <div>
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-24 h-4" />
        </div>

        {/* Ends at */}
        <div>
          <Skeleton className="w-40 h-5" />
        </div>

        {/* Activity */}
        <div className="h-[42px]">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-32 h-5" />
        </div>

        {/* Volume */}
        <div>
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-full h-3" />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col flex-1 mt-5">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
    </>
  );
};

export default LoadingTimerRightPart;
