import {
  createContext,
  useRef,
  useEffect,
  useContext,
  ReactNode,
  FC,
} from 'react';
import { useAppSelector } from '../redux/store';
import defaultAudioUrl from '../assets/discordSound.mp3';

interface AudioPlayerContextType {
  currentAudio: HTMLAudioElement;
  playAudio: () => void;
  stopAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentAudio: new Audio(defaultAudioUrl),
  playAudio: () => {},
  stopAudio: () => {},
});

interface AudioPlayerProviderProps {
  children: ReactNode;
}

const AudioPlayerProvider: FC<AudioPlayerProviderProps> = ({ children }) => {
  const currentAudioRef = useRef<HTMLAudioElement>(new Audio(defaultAudioUrl));
  const currentUser = useAppSelector((state) => state.users.user);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const currentUserAudio = currentUser.audios.find((a) => a.current);
    if (currentUserAudio) {
      currentAudioRef.current = new Audio(currentUserAudio.url);
    } else {
      currentAudioRef.current = new Audio(defaultAudioUrl);
    }
  }, [currentUser?.audios]);

  const playAudio = () => {
    currentAudioRef.current.volume = 0.35;
    currentAudioRef.current.currentTime = 0;
    currentAudioRef.current.play();
  };

  // TODO: проверить работоспособность (начать где-то использовать)
  const stopAudio = () => {
    currentAudioRef.current.pause();
  };

  return (
    <AudioPlayerContext.Provider
      value={{ currentAudio: currentAudioRef.current, playAudio, stopAudio }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;

export const useAudioPlayer = () => useContext(AudioPlayerContext);
