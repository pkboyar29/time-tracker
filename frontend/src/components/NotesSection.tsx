import { FC, useState } from 'react';
import { useTimer } from '../hooks/useTimer';
import { updateSession } from '../api/sessionApi';

interface NotesSectionProps {
  defaultNote?: string;
}

const NotesSection: FC<NotesSectionProps> = ({ defaultNote }) => {
  const { timerState, setNote: setNoteInsideTimer } = useTimer();

  const [note, setNote] = useState<string>(defaultNote ? defaultNote : '');

  const handleChangeNoteInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setNote(event.target.value);
  };

  const handleBlurNoteInput = async () => {
    if (timerState.status != 'idle' && timerState.session.note !== note) {
      // TODO: обрабатывать серверные ошибки
      await updateSession({
        ...timerState.session,
        note,
      });

      setNoteInsideTimer(note);
    }
  };

  return (
    <textarea
      placeholder="Enter your thoughts during this session..."
      value={note}
      onChange={handleChangeNoteInput}
      onBlur={handleBlurNoteInput}
      maxLength={1600}
      className="flex-grow p-3 text-base font-medium bg-white border border-gray-300 rounded-lg resize-none dark:text-textDark dark:bg-surfaceDarkHover dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
};

export default NotesSection;
