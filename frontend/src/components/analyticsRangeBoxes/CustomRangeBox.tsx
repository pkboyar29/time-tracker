import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toLocalISOString } from '../../helpers/dateHelpers';
import { toast } from 'react-toastify';

import Button from '../Button';

interface CustomRangeBoxProps {
  fromDate: Date;
  toDate: Date;
}

const CustomRangeBox: FC<CustomRangeBoxProps> = ({ fromDate, toDate }) => {
  const navigate = useNavigate();

  const [from, setFrom] = useState<string>(toLocalISOString(fromDate));
  const [to, setTo] = useState<string>(toLocalISOString(toDate));

  const [isEditing, setIsEditing] = useState<boolean>(false);

  // FOCUS: тут string надо преобразовывать в ISO string
  const handleApply = () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate.getTime() > toDate.getTime()) {
      toast('"to date" should be later than "from date"', { type: 'error' });
      return;
    }

    navigate(
      `/analytics/range?from=${fromDate.toISOString()}&to=${toDate.toISOString()}`
    );
    setIsEditing(false);
  };

  return (
    <div className="relative flex gap-4">
      <label className="flex flex-col gap-1 text-lg text-gray-700">
        From:
        <input
          value={from}
          onChange={(e) => {
            setIsEditing(true);
            setFrom(e.target.value);
          }}
          className="px-3 py-2 text-lg bg-transparent border border-gray-300 border-solid rounded-md shadow-sm"
          type="datetime-local"
        />
      </label>

      <label className="flex flex-col gap-1 text-lg text-gray-700">
        To:
        <input
          value={to}
          onChange={(e) => {
            setIsEditing(true);
            setTo(e.target.value);
          }}
          className="px-3 py-2 text-lg bg-transparent border border-gray-300 border-solid rounded-md shadow-sm"
          type="datetime-local"
        />
      </label>

      <div
        className={`w-[90px] absolute -right-[106px] top-1/2 -translate-y-1/2 ${
          !isEditing && 'hidden'
        }`}
      >
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </div>
  );
};

export default CustomRangeBox;
