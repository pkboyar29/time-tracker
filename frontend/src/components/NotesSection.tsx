import { FC, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { changeNote } from '../redux/slices/sessionSlice';
import { updateSession } from '../api/sessionApi';

const NotesSection: FC = () => {
  const currentSession = useAppSelector(
    (state) => state.sessions.currentSession
  );
  const dispatch = useAppDispatch();

  const [note, setNote] = useState<string>('');
  const [isFocusedNote, setFocusedNote] = useState<boolean>(false);

  useEffect(() => {
    if (currentSession) {
      // TODO: зачем второе условие?
      if (!isFocusedNote) {
        setNote(currentSession.note ? currentSession.note : '');
      }
    }
  }, [currentSession]);

  const handleChangeNoteInput = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setNote(event.target.value);
  };

  const handleFocusNoteInput = () => {
    setFocusedNote(true);
  };

  const handleBlurNoteInput = () => {
    setFocusedNote(false);

    if (currentSession) {
      if (currentSession.note !== note) {
        dispatch(changeNote(note));

        updateSession({
          ...currentSession,
          note,
        });
      }
    }
  };

  return (
    <textarea
      placeholder="Enter your thoughts during this session..."
      value={note}
      onChange={handleChangeNoteInput}
      onFocus={handleFocusNoteInput}
      onBlur={handleBlurNoteInput}
      maxLength={1600}
      className="flex-grow p-3 text-base font-medium bg-white border border-gray-300 rounded-lg resize-none dark:text-textDark dark:bg-surfaceDarkHover dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
};

export default NotesSection;
