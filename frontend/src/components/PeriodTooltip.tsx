import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../redux/store';
import { getReadableTime } from '../helpers/timeHelpers';
import { getRangeType } from '../helpers/dateHelpers';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';
import { IActivityDistribution } from '../ts/interfaces/Statistics/IActivityDistribution';

interface PeriodTooltipProps {
  payload?: any[] | null;
  adMode: boolean;
}

const PeriodTooltip: FC<PeriodTooltipProps> = ({ payload, adMode }) => {
  if (!payload) {
    return null;
  }

  const { t } = useTranslation();

  const isVisible = payload && payload.length;
  const timeBar: ITimeBar = payload[0]?.payload;

  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo ? userInfo.dailyGoal : 1_000_000;

  return (
    <div
      className="p-2.5 bg-surfaceLight dark:bg-surfaceDark rounded-sm border border-gray-300/80 dark:border-white/10 
        border-solid max-h-[280px] overflow-y-auto w-[220px] pointer-events-auto"
      style={{
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      {isVisible && (
        <div className="flex flex-col gap-2.5">
          <p className="text-primary text-[15px]">{`${timeBar.barDetailedName}`}</p>
          {timeBar.sessionStatistics.spentTimeSeconds == 0 ? (
            <p className="text-gray-800 dark:text-textDark">
              {t('pdBox.noActivity')}
            </p>
          ) : (
            <>
              {!adMode ? (
                <>
                  {getRangeType(timeBar.startOfRange, timeBar.endOfRange) ==
                    'days' && (
                    <p className="text-gray-800 dark:text-textDark">
                      {`${t('pdBox.dailyGoal')} ${
                        timeBar.sessionStatistics.spentTimeSeconds >=
                        dailyGoalSeconds
                          ? '✅'
                          : '❌'
                      }`}
                    </p>
                  )}

                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(
                      timeBar.sessionStatistics.spentTimeSeconds,
                      t,
                      {
                        short: false,
                      },
                    )}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', {
                      count: timeBar.sessionStatistics.sessionsAmount,
                    })}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.pauses', {
                      count: timeBar.sessionStatistics.pausedAmount,
                    })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-800 dark:text-textDark">
                    {getReadableTime(
                      timeBar.sessionStatistics.spentTimeSeconds,
                      t,
                      {
                        short: false,
                      },
                    )}
                  </p>

                  <p className="text-gray-800 dark:text-textDark">
                    {t('plural.sessions', {
                      count: timeBar.sessionStatistics.sessionsAmount,
                    })}
                  </p>
                </>
              )}

              {adMode && (
                <>
                  {timeBar.adItems.map(
                    (item: IActivityDistribution, index: number) => (
                      <div className="flex items-center gap-2.5" key={index}>
                        <div
                          style={{ backgroundColor: item.fill }}
                          className="w-10 h-3 rounded-lg shrink-0"
                        />

                        <div className="flex flex-col min-w-0">
                          <div className="text-[15px] truncate dark:text-textDark">
                            {item.name}
                          </div>

                          <div className="text-[13px] mt-1 text-gray-600 dark:text-textDarkSecondary">
                            (
                            {getReadableTime(
                              item.sessionStatistics.spentTimeSeconds,
                              t,
                              {
                                short: true,
                              },
                            )}
                            ,{' '}
                            {t('plural.sessions', {
                              count: item.sessionStatistics.sessionsAmount,
                            })}
                            )
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodTooltip;
