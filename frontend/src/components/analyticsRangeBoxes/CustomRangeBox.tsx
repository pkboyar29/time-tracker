import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toLocalISOString } from '../../helpers/dateHelpers';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import Button from '../common/Button';

interface CustomRangeBoxProps {
  fromDate: Date;
  toDate: Date;
}

const CustomRangeBox: FC<CustomRangeBoxProps> = ({ fromDate, toDate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [from, setFrom] = useState<string>(toLocalISOString(fromDate));
  const [to, setTo] = useState<string>(toLocalISOString(toDate));

  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleApply = () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate.getTime() > toDate.getTime()) {
      toast(t('customRangeBox.error'), { type: 'error' });
      return;
    }

    navigate(
      `/analytics/range?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
    );
    setIsEditing(false);
  };

  return (
    <div className="md:ml-[110px] flex flex-col md:flex-row items-center justify-center h-full gap-4">
      <div className="flex flex-wrap justify-center gap-4">
        <label className="flex flex-col gap-1 text-lg text-gray-700 dark:text-textDarkSecondary">
          {t('customRangeBox.from')}:
          <input
            value={from}
            onChange={(e) => {
              setIsEditing(true);
              setFrom(e.target.value);
            }}
            className="px-3 py-2 text-lg bg-transparent border border-gray-300 border-solid rounded-md shadow-sm dark:border-gray-500"
            type="datetime-local"
          />
        </label>

        <label className="flex flex-col gap-1 text-lg text-gray-700 dark:text-textDarkSecondary">
          {t('customRangeBox.to')}:
          <input
            value={to}
            onChange={(e) => {
              setIsEditing(true);
              setTo(e.target.value);
            }}
            className="px-3 py-2 text-lg bg-transparent border border-gray-300 border-solid rounded-md shadow-sm dark:border-gray-500"
            type="datetime-local"
          />
        </label>
      </div>

      <div className="w-[110px] h-[32px]">
        {isEditing && (
          <Button onClick={handleApply}>{t('customRangeBox.apply')}</Button>
        )}
      </div>
    </div>
  );
};

export default CustomRangeBox;
