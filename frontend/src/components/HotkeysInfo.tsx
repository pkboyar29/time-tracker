import { FC } from 'react';

const HotkeysInfo: FC = () => {
  const hotkeys = [
    {
      combo: 'Space',
      description: 'Start / pause / resume session',
    },
    {
      combo: 'Escape',
      description: 'Stop session',
    },
    {
      combo: '← / →',
      description: 'Navigate between dates in analytics',
    },
    {
      combo: 'Ctrl + ← / Ctrl + →',
      description: 'Navigate between date ranges in analytics',
    },
  ];

  return (
    <div className="hidden p-5 shadow-md md:block rounded-2xl dark:text-textDark bg-surfaceLightHover dark:bg-surfaceDarkDarker">
      <div className="flex items-center gap-2 mb-4 text-xl font-semibold">
        <span>⌨️</span>
        Hotkeys
      </div>

      <div className="flex flex-col gap-3">
        {hotkeys.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-700"
          >
            <div className="font-mono text-lg">{item.combo}</div>
            <div className="text-base opacity-80">{item.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotkeysInfo;
