import { FC, useRef, useLayoutEffect } from 'react';
import { ISessionStatistics } from '../ts/interfaces/Statistics/ISessionStatistics';
import { getReadableTimeHMS } from '../helpers/timeHelpers';
import {
  animateCountUp,
  animateCountUpWithInterval,
} from '../helpers/htmlHelpers';

import QuestionMarkTooltip from './common/QuestionMarkTooltip';

interface SessionStatisticsBoxProps {
  statistics: ISessionStatistics;
}

const SessionStatisticsBox: FC<SessionStatisticsBoxProps> = ({
  statistics,
}) => {
  const totalTimeRef = useRef<HTMLDivElement | null>(null);
  const totalSessionsRef = useRef<HTMLDivElement | null>(null);
  const distractedRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (statistics.sessionsAmount < 2 || statistics.spentTimeSeconds < 300) {
      totalTimeRef.current!.textContent = getReadableTimeHMS(
        statistics.spentTimeSeconds,
        false,
        true
      );
      totalSessionsRef.current!.textContent =
        statistics.sessionsAmount.toString();
      distractedRef.current!.textContent = statistics.pausedAmount.toString();
    } else {
      animateCountUpWithInterval(
        totalTimeRef.current!,
        statistics.spentTimeSeconds,
        1500,
        0.5,
        (seconds) => getReadableTimeHMS(seconds, false, true)
      );
      animateCountUp(
        totalSessionsRef.current!,
        statistics.sessionsAmount,
        1500,
        null
      );
      animateCountUp(
        distractedRef.current!,
        statistics.pausedAmount,
        1500,
        null,
        'times'
      );
    }
  }, [statistics]);

  return (
    <div className="flex flex-wrap justify-center gap-5 px-10 py-5 border border-solid rounded-lg md:gap-10 2xl:gap-20 bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="text-center">
        <div
          ref={totalTimeRef}
          className="text-xl font-bold dark:text-textDark min-w-[165px]"
        >
          {getReadableTimeHMS(statistics.spentTimeSeconds)}
        </div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          total time
        </div>
      </div>

      <div className="text-center">
        <div
          ref={totalSessionsRef}
          className="text-xl font-bold dark:text-textDark"
        >
          {statistics.sessionsAmount}
        </div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          total sessions
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div
          ref={distractedRef}
          className="text-xl font-bold dark:text-textDark"
        >
          {statistics.pausedAmount} times
        </div>
        <div className="relative w-fit">
          <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
            distracted
          </div>

          <div className="absolute pl-2 -top-0.5 left-full">
            <QuestionMarkTooltip tooltipText="Number of times you pressed pause during the session" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatisticsBox;
