import { FC, useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { updateSessionNote } from '../api/sessionApi';
import { useTranslation } from 'react-i18next';
import { setNoteInLS, getNoteFromLS } from '../helpers/localstorageHelpers';

// TODO: мы никак не удаляем ключи из local storage, даже если сессия завершила свою работу, и ее заметка никогда больше не будет нужна. Так можно полностью засорить local storage

const NotesSection: FC = () => {
  const { t } = useTranslation();

  const { timerState } = useTimer();

  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (!timerState.session) return;

    const sessionNoteFromLS = getNoteFromLS(timerState.session.id);
    setNote(
      sessionNoteFromLS ? sessionNoteFromLS : (timerState.session.note ?? ''),
    );
  }, [timerState.session?.id]);

  const handleChangeNoteInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (!timerState.session) return;

    setNote(event.target.value);
    setNoteInLS(timerState.session.id, event.target.value);
  };

  const handleBlurNoteInput = async () => {
    if (timerState.status == 'idle') return;

    // TODO: будет работать только если мы не изменяли ввод. Если же его немного изменить, то все, timerState.session.note мы не изменяем, и соответственно проверка всегда будет false
    if (note === timerState.session.note) return;

    await updateSessionNote(timerState.session.id);
  };

  return (
    <textarea
      placeholder={t('timerPage.notesPlaceholder')}
      value={note}
      onChange={handleChangeNoteInput}
      onBlur={handleBlurNoteInput}
      maxLength={1600}
      className="flex-grow p-3 text-base font-medium bg-white border border-gray-300 rounded-lg resize-none dark:text-textDark dark:bg-surfaceDarkHover dark:border-gray-500 focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
};

export default NotesSection;
