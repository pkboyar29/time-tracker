import { FC } from 'react';

interface SessionDurationInputsProps {
  seconds: number;
  setSeconds: (newSeconds: number) => void;
}

const SessionDurationInputs: FC<SessionDurationInputsProps> = ({
  seconds,
  setSeconds,
}) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return (
    <div className="flex gap-4 mt-4">
      <div className="flex-1">
        <label className="block mb-1 text-base font-medium dark:text-textDark">
          Hours
        </label>
        <input
          type="number"
          min={0}
          max={10}
          value={hours}
          onChange={(e) => {
            const h = Number(e.target.value);
            if (h == 0 && minutes == 0) {
              setSeconds(60);
            } else if (h >= 0 && h < 10) {
              setSeconds(h * 3600 + minutes * 60);
            } else if (h == 10) {
              setSeconds(h * 3600);
            }
          }}
          className="w-full p-2 bg-white rounded dark:text-textDark dark:bg-surfaceDarkHover"
        />
      </div>

      <div className="flex-1">
        <label className="block mb-1 text-base font-medium dark:text-textDark">
          Minutes
        </label>
        <input
          type="number"
          min={0}
          max={59}
          value={minutes}
          disabled={hours == 10}
          onChange={(e) => {
            const m = Number(e.target.value);
            if (m == 0 && hours == 0) {
              setSeconds(60);
            } else if (m >= 0 && m <= 59 && hours < 10) {
              setSeconds(hours * 3600 + m * 60);
            }
          }}
          className="w-full p-2 bg-white rounded dark:text-textDark dark:bg-surfaceDarkHover"
        />
      </div>
    </div>
  );
};

export default SessionDurationInputs;
