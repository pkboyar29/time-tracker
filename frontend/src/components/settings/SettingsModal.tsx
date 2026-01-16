import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Modal from '../modals/Modal';
import SettingsGeneralSection from './SettingsGeneralSection';
import SettingsAudioSection from './SettingsAudioSection';
import SettingsNavItem from './SettingsNavItem';
import HotkeysInfo from '../HotkeysInfo';

interface SettingsModalProps {
  onCloseModal: () => void;
}

type SettingsSection = 'general' | 'audio' | 'hotkeys';

const SettingsModal: FC<SettingsModalProps> = ({ onCloseModal }) => {
  const { t } = useTranslation();

  const [activeSection, setActiveSection] =
    useState<SettingsSection>('general');

  return (
    <Modal
      modalClassnames="pt-5 pb-0"
      title={t('settingsModal.title')}
      onCloseModal={onCloseModal}
    >
      <div className="h-[60vh] sm:h-[50vh] flex flex-col sm:flex-row gap-2 pr-1.5 sm:pr-2">
        <aside className="w-full pr-2 sm:border-r sm:border-solid sm:w-36 sm:shrink-0 dark:sm:border-white/10 sm:border-gray-200">
          <nav className="flex flex-row gap-1 sm:flex-col">
            <SettingsNavItem
              label={t('settingsModal.general')}
              isActive={activeSection === 'general'}
              onClick={() => setActiveSection('general')}
            />
            <SettingsNavItem
              label={t('settingsModal.audio')}
              isActive={activeSection === 'audio'}
              onClick={() => setActiveSection('audio')}
            />
            <SettingsNavItem
              label={t('hotkeys.title')}
              className="hidden md:block"
              isActive={activeSection === 'hotkeys'}
              onClick={() => setActiveSection('hotkeys')}
            />
          </nav>
        </aside>

        <section className="flex-1 overflow-y-auto px-1.5 sm:px-2">
          {activeSection === 'general' && <SettingsGeneralSection />}
          {activeSection === 'audio' && <SettingsAudioSection />}
          {activeSection === 'hotkeys' && <HotkeysInfo />}
        </section>
      </div>
    </Modal>
  );
};

export default SettingsModal;
