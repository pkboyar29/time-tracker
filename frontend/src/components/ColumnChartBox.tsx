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

import { ITimeBar } from '../ts/interfaces/Statistics/ITimeBar';

interface ColumnChartBoxProps {
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
      className="p-2.5 bg-white rounded-sm border border-gray-300/80 border-solid w-[210px]"
      style={{ visibility: isVisible ? 'visible' : 'hidden' }}
    >
      {isVisible && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[#EF4444] text-[15px]">{`${payload[0].payload.barDetailedName}`}</p>
          {payload[0].payload.spentTimeSeconds == 0 ? (
            <p className="text-gray-800">No session activity this period</p>
          ) : (
            <>
              <p className="text-gray-800">
                {getTimeHoursMinutes(payload[0].payload.spentTimeSeconds)}

                {getRangeType(
                  payload[0].payload.startOfRange,
                  payload[0].payload.endOfRange
                ) == 'days' &&
                  (payload[0].payload.spentTimeSeconds > dailyGoalSeconds
                    ? ' (daily goal ✅)'
                    : ' (daily goal ❌)')}
              </p>
              {/* FOCUS: если это день и при этом в этом дне цель дня выполнена можно в скобочках показывать что то типо (daily goal ✅) */}
              <p className="text-gray-800">
                {payload[0].payload.sessionsAmount} sessions
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const ColumnChartBox: FC<ColumnChartBoxProps> = ({ timeBars }) => {
  const userInfo = useAppSelector((state) => state.users.user);
  const dailyGoalSeconds = userInfo!.dailyGoal;

  return (
    <div className="p-2 px-10 py-5 bg-white border border-solid rounded-lg border-gray-300/80">
      <div className="flex justify-end">
        <div className="inline-block px-4 py-1 mb-4 ml-auto text-lg font-medium tracking-wide text-gray-800 bg-gray-200 rounded-lg">
          Period distribution
        </div>
      </div>

      <BarChart width={730} height={250} data={timeBars}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="barName" />
        <YAxis dataKey="spentTimeSeconds" />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="spentTimeSeconds" fill="#E5E7EB">
          {timeBars.map((bar, index) => {
            const color =
              getRangeType(bar.startOfRange, bar.endOfRange) == 'days' &&
              bar.spentTimeSeconds > dailyGoalSeconds
                ? '#EF4444'
                : '#E5E7EB';
            return <Cell key={index} fill={color} />;
          })}
        </Bar>
      </BarChart>
    </div>
  );
};

export default ColumnChartBox;
