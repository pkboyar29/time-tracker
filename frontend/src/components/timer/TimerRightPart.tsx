import { FC, useState, useEffect } from 'react';
import { useQueryCustom } from '../../hooks/useQueryCustom';
import { fetchActivities } from '../../api/activityApi';
import { useTimer } from '../../hooks/useTimer';
import {
  getReadableTime,
  getTimeHHmmFromDate,
} from '../../helpers/timeHelpers';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import {
  setActivityInLS,
  setSelectedSecondsInLS,
} from '../../helpers/localstorageHelpers';

import PrimaryClipLoader from '../common/PrimaryClipLoader';
import CustomSelect from '../common/CustomSelect';
import SegmentedControl from '../common/SegmentedControl';
import RangeSlider from '../common/RangeSlider';
import SessionDurationInputs from '../SessionDurationInputs';
import SpeakerCrossIcon from '../../icons/SpeakerCrossIcon';
import SpeakerWaveIcon from '../../icons/SpeakerWaveIcon';
import NotesSection from '../NotesSection';

interface TimerRightPartProps {
  selectedSeconds: number;
  selectedActivityId: string;
  setSelectedSeconds: (newSeconds: number) => void;
  setSelectedActivityId: (newActivityId: string) => void;
}

const TimerRightPart: FC<TimerRightPartProps> = ({
  selectedSeconds,
  selectedActivityId,
  setSelectedSeconds,
  setSelectedActivityId,
}) => {
  const { t } = useTranslation();

  const { data: activitiesToChoose, isLoading: isLoadingActivities } =
    useQueryCustom({
      queryKey: ['activitiesToChoose'],
      queryFn: () => fetchActivities(),
    });

  const { timerState, timerEndDate } = useTimer();
  const isTimerStarted = timerState.status != 'idle';

  const { currentVolume, updateVolume } = useAudioPlayer();

  const [durationMode, setDurationMode] = useState<'rangeSlider' | 'inputs'>(
    'rangeSlider',
  );

  useEffect(() => {
    if (activitiesToChoose) {
      if (
        ![
          ...activitiesToChoose.topActivities,
          ...activitiesToChoose.remainingActivities,
        ].find((a) => a.id === selectedActivityId)
      ) {
        setSelectedActivityId('');
        setActivityInLS('');
      }
    }
  }, [activitiesToChoose]);

  const onActivitiesSelectChange = (id: string) => {
    setSelectedActivityId(id);
    setActivityInLS(id);
  };

  const onRangeSliderChange = (newValue: number) => {
    const newSeconds = newValue * 60;
    setSelectedSeconds(newSeconds);
    setSelectedSecondsInLS(newSeconds);
  };

  const onSessionInputsChange = (newSeconds: number) => {
    setSelectedSeconds(newSeconds);
    setSelectedSecondsInLS(newSeconds);
  };

  return (
    <div
      className="min-h-[575px] flex flex-col flex-1 w-full p-6 sm:overflow-y-hidden rounded-lg shadow-md lg:flex-none 
    lg:w-96 bg-surfaceLightHover dark:bg-surfaceDark basis-1/3 sm:basis-auto"
    >
      <div className="flex flex-col flex-grow gap-5">
        {isTimerStarted && (
          <>
            <div className="text-lg font-semibold dark:text-textDark">
              {t('timerPage.session')}{' '}
              {getReadableTime(timerState.session.totalTimeSeconds, t, {
                short: false,
              })}
            </div>

            <div className="flex items-center dark:text-textDark">
              <span>{t('timerPage.endsAt')}</span>
              <span className="inline-block min-w-[3.5rem] text-center font-bold">
                {timerState.status === 'paused'
                  ? '...'
                  : getTimeHHmmFromDate(timerEndDate)}
              </span>
            </div>
          </>
        )}

        <div className="dark:text-textDark">
          <span className="block mb-0 text-lg font-semibold sm:mb-2 dark:text-textDark">
            {t('timerPage.activity')}
            {isTimerStarted && (
              <span className="text-base dark:text-textDark sm:hidden">
                :{' '}
                {timerState.session?.activity
                  ? timerState.session?.activity.name
                  : t('withoutActivity')}
              </span>
            )}
          </span>
          {!isTimerStarted ? (
            <div className="h-[42px] flex items-center">
              {isLoadingActivities ? (
                <PrimaryClipLoader size="25px" />
              ) : (
                activitiesToChoose && (
                  <CustomSelect
                    currentId={selectedActivityId}
                    onChange={onActivitiesSelectChange}
                    optionGroups={[
                      {
                        optGroupName: '',
                        color: 'grey',
                        options: [{ id: '', name: t('withoutActivity') }],
                      },
                      {
                        optGroupName: `${t('timerPage.lastActivities')} ⭐`,
                        color: 'red',
                        options: activitiesToChoose.topActivities,
                      },
                      {
                        optGroupName: t('timerPage.allActivities'),
                        color: 'standart',
                        options: [...activitiesToChoose.remainingActivities],
                      },
                    ]}
                  />
                )
              )}
            </div>
          ) : timerState.session.activity ? (
            <div className="hidden text-base sm:block dark:text-textDark">
              {timerState.session.activity.name}
            </div>
          ) : (
            <div className="hidden text-base italic text-gray-500 sm:block dark:text-textDarkSecondary">
              {t('withoutActivity')}
            </div>
          )}
        </div>

        {!isTimerStarted && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-lg font-semibold dark:text-textDark">
                {t('timerPage.sessionDuration')}
              </span>

              <SegmentedControl
                options={[
                  {
                    value: 'rangeSlider',
                    label: t('timerPage.rangeSlider'),
                  },
                  { value: 'inputs', label: t('timerPage.inputs') },
                ]}
                value={durationMode}
                onChange={(value) =>
                  setDurationMode(value as 'rangeSlider' | 'inputs')
                }
              />
            </div>

            {durationMode == 'rangeSlider' ? (
              <div className="mt-4">
                <RangeSlider
                  minValue={1}
                  maxValue={600}
                  currentValue={selectedSeconds / 60}
                  changeCurrentValue={onRangeSliderChange}
                />
              </div>
            ) : (
              <SessionDurationInputs
                seconds={selectedSeconds}
                setSeconds={onSessionInputsChange}
              />
            )}
          </div>
        )}

        {isTimerStarted && (
          <div className="flex flex-col gap-4">
            <span className="block text-lg font-semibold dark:text-textDark">
              {t('timerPage.volume')}
            </span>

            <div className="flex items-center gap-2">
              {currentVolume === 0 ? <SpeakerCrossIcon /> : <SpeakerWaveIcon />}

              <RangeSlider
                minValue={0}
                maxValue={100}
                currentValue={currentVolume}
                changeCurrentValue={updateVolume}
              />
            </div>
          </div>
        )}

        {isTimerStarted && (
          <div className="flex flex-col flex-grow">
            <div className="mb-2 text-xl font-bold dark:text-textDark">
              {t('timerPage.notes')}
            </div>
            <NotesSection />
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerRightPart;
