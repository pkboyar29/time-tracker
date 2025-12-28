import { FC } from 'react';
import { useTranslation } from 'react-i18next';

const HotkeysInfo: FC = () => {
  const { t } = useTranslation();

  const hotkeys = [
    {
      combo: 'Space',
      description: t('hotkeys.space'),
    },
    {
      combo: 'Escape',
      description: t('hotkeys.escape'),
    },
    {
      combo: '← / →',
      description: t('hotkeys.arrow_left_right'),
    },
    {
      combo: 'Ctrl + ← / Ctrl + →',
      description: t('hotkeys.ctrl_arrow_left_right'),
    },
  ];

  return (
    <div className="hidden p-5 shadow-md md:block rounded-2xl dark:text-textDark bg-surfaceLightHover dark:bg-surfaceDarkDarker">
      <div className="flex items-center gap-2 mb-4 text-xl font-semibold">
        <span>⌨️</span>
        {t('hotkeys.title')}
      </div>

      <div className="flex flex-col gap-3">
        {hotkeys.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between pb-2 border-b border-gray-300 dark:border-gray-700"
          >
            <div className="font-mono text-base lg:text-lg">{item.combo}</div>
            <div className="text-sm text-right lg:text-base opacity-80">
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotkeysInfo;
