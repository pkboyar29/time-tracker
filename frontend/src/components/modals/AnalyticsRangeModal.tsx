import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDayRange } from '../../helpers/dateHelpers';

import Modal from './Modal';
import Button from '../common/Button';

interface AnalyticsRangeModalProps {
  onCloseModal: () => void;
}

const AnalyticsRangeModal: FC<AnalyticsRangeModalProps> = ({
  onCloseModal,
}) => {
  const navigate = useNavigate();
  const [startOfDay, endOfDay] = getDayRange(new Date());

  const [from, setFrom] = useState<string>(
    startOfDay.toISOString().substring(0, 16)
  );
  const [to, setTo] = useState<string>(endOfDay.toISOString().substring(0, 16));

  const handleApply = () => {
    navigate(
      `/analytics/range?from=${from.concat(':00.000Z')}&to=${to.concat(
        ':00.000Z'
      )}`
    );
  };

  return (
    <Modal
      title="Select a date range to display analytics"
      onCloseModal={onCloseModal}
    >
      <div className="flex flex-col gap-4 mt-4">
        <label className="flex flex-col gap-1 text-lg text-gray-700">
          From:
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 text-lg border border-gray-300 border-solid rounded-md shadow-sm"
            type="datetime-local"
          />
        </label>

        <label className="flex flex-col gap-1 text-lg text-gray-700">
          To:
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 text-lg border border-gray-300 border-solid rounded-md shadow-sm"
            type="datetime-local"
          />
        </label>

        <div className="flex justify-end">
          <Button onClick={handleApply}>Apply</Button>
        </div>
      </div>
    </Modal>
  );
};

export default AnalyticsRangeModal;
