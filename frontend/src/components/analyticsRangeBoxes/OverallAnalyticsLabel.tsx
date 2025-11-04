import { FC } from 'react';
import { useAppSelector } from '../../redux/store';
import { formatDate } from '../../helpers/dateHelpers';

const OverallAnalyticsLabel: FC = () => {
  const currentUser = useAppSelector((state) => state.users.user);

  return (
    <div className="h-full py-10 text-center">
      <div className="text-xl font-semibold">Overall session analytics</div>
      <div className="flex items-center justify-center gap-2 mt-2 text-base text-gray-500">
        <span>
          {currentUser ? formatDate(currentUser.createdDate) : '...'} → now
        </span>
      </div>
    </div>
  );
};

export default OverallAnalyticsLabel;
