import { FC } from 'react';
import {
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useAppSelector } from '../redux/store';
import { getTimeHoursMinutes } from '../helpers/timeHelpers';
import { getRangeType } from '../helpers/dateHelpers';
import { colors } from '../../design-tokens';

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';

interface PeriodDistributionBoxProps {
  timeBars: ITimeBar[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: number;
}
const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload }) => {
  const isVisible = active && payload && payload.length;

  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo!.dailyGoal;

  return (
    <div
      className="p-2.5 bg-surfaceLight dark:bg-surfaceDark rounded-sm border border-gray-300/80 border-solid w-[210px]"
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {isVisible && (
        <div className="flex flex-col gap-2.5">
          <p className="text-primary text-[15px]">{`${payload[0].payload.barDetailedName}`}</p>
          {payload[0].payload.spentTimeSeconds == 0 ? (
            <p className="text-gray-800 dark:text-textDark">
              No session activity this period
            </p>
          ) : (
            <>
              <p className="text-gray-800 dark:text-textDark">
                {getTimeHoursMinutes(payload[0].payload.spentTimeSeconds)}

                {getRangeType(
                  payload[0].payload.startOfRange,
                  payload[0].payload.endOfRange
                ) == 'days' &&
                  (payload[0].payload.spentTimeSeconds > dailyGoalSeconds
                    ? ' (daily goal ✅)'
                    : ' (daily goal ❌)')}
              </p>
              <p className="text-gray-800 dark:text-textDark">
                {payload[0].payload.sessionsAmount} sessions
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const PeriodDistributionBox: FC<PeriodDistributionBoxProps> = ({
  timeBars,
}) => {
  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo!.dailyGoal;

  return (
    <div className="p-2 px-10 py-5 border border-solid rounded-lg bg-surfaceLight dark:bg-surfaceDark border-gray-300/80 dark:border-gray-500">
      <div className="flex justify-end">
        <div className="inline-block px-4 py-1 mb-4 ml-auto text-lg font-medium tracking-wide rounded-lg text-gray-800 bg-gray-200 dark:bg-[rgba(255,255,255,0.05)] dark:text-textDark">
          Period distribution
        </div>
      </div>

      <BarChart width={730} height={250} data={timeBars}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="barName"
          // tick={{
          //   fill:
          //     localStorage.getItem('theme') === 'dark'
          //       ? colors.textDarkSecondary
          //       : '#000',
          // }}
        />
        <YAxis dataKey="spentTimeSeconds" />
        <Tooltip content={<CustomTooltip />} />
        {/* TODO: сменить цвет фона при наведении. он тут даже не указан для светлой темы */}
        <Bar dataKey="spentTimeSeconds">
          {timeBars.map((bar, index) => {
            const color =
              getRangeType(bar.startOfRange, bar.endOfRange) == 'days' &&
              bar.spentTimeSeconds > dailyGoalSeconds
                ? colors.primary
                : localStorage.getItem('theme') === 'dark'
                ? '#424242'
                : '#E5E7EB';
            return <Cell key={index} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </div>
  );
};

export default PeriodDistributionBox;
