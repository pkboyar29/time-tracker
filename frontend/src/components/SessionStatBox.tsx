import { FC, useRef, useLayoutEffect } from 'react';
import { ISessionStat } from '../ts/interfaces/Statistics/ISessionStat';
import { getReadableTime } from '../helpers/timeHelpers';
import {
  animateCountUp,
  animateCountUpWithInterval,
} from '../helpers/htmlHelpers';
import { useTranslation } from 'react-i18next';

import QuestionMarkTooltip from './common/QuestionMarkTooltip';

interface SessionStatBoxProps {
  statistics: ISessionStat;
}

const SessionStatBox: FC<SessionStatBoxProps> = ({ statistics }) => {
  const { t, i18n } = useTranslation();

  const totalTimeRef = useRef<HTMLDivElement | null>(null);
  const totalSessionsRef = useRef<HTMLDivElement | null>(null);
  const distractedRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (statistics.sessionsAmount < 2 || statistics.spentTimeSeconds < 300) {
      totalTimeRef.current!.textContent = getReadableTime(
        statistics.spentTimeSeconds,
        t,
        { short: false, zeroUnits: true },
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
        (seconds) =>
          getReadableTime(seconds, t, { short: false, zeroUnits: true }),
      );
      animateCountUp(
        totalSessionsRef.current!,
        statistics.sessionsAmount,
        1500,
        null,
      );
      animateCountUp(
        distractedRef.current!,
        statistics.pausedAmount,
        1500,
        (seconds) => t('plural.times', { count: seconds }),
      );
    }
  }, [statistics, i18n.language]);

  return (
    <div className="flex flex-wrap justify-center gap-5 px-10 py-5 border border-solid rounded-lg md:gap-10 2xl:gap-20 bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-white/10">
      <div className="text-center">
        <div
          ref={totalTimeRef}
          className="text-xl font-bold dark:text-textDark min-w-[170px]"
        ></div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          {t('sessionStatBox.totalTime')}
        </div>
      </div>

      <div className="text-center">
        <div
          ref={totalSessionsRef}
          className="text-xl font-bold dark:text-textDark"
        ></div>
        <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
          {t('sessionStatBox.totalSessions')}
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div
          ref={distractedRef}
          className="text-xl font-bold dark:text-textDark"
        ></div>
        <div className="relative w-fit">
          <div className="text-lg font-bold text-gray-500 uppercase dark:text-textDarkSecondary">
            {t('sessionStatBox.distracted')}
          </div>

          <div className="absolute pl-2 -top-0.5 left-full">
            <QuestionMarkTooltip
              tooltipText={t('sessionStatBox.distractedTooltip')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionStatBox;
