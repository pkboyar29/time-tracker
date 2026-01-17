import {
  createContext,
  useRef,
  useEffect,
  useContext,
  ReactNode,
  FC,
  useState,
} from 'react';
import { useAppSelector } from '../redux/store';
import defaultAudioUrl from '../assets/discordSound.mp3';
import { getVolumeFromLS, setVolumeInLS } from '../helpers/localstorageHelpers';

interface AudioPlayerContextType {
  currentAudio: HTMLAudioElement;
  currentVolume: number; // 0 - 100
  updateVolume: (newVolume: number) => void;
  playAudio: () => void;
  stopAudio: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentAudio: new Audio(defaultAudioUrl),
  currentVolume: getVolumeFromLS(),
  updateVolume: () => {},
  playAudio: () => {},
  stopAudio: () => {},
});

interface AudioPlayerProviderProps {
  children: ReactNode;
}

const getSafeVolume = (volume: number) => {
  return Math.min(Math.max(volume / 100, 0), 1);
};

const AudioPlayerProvider: FC<AudioPlayerProviderProps> = ({ children }) => {
  const currentAudioRef = useRef<HTMLAudioElement>(new Audio(defaultAudioUrl));
  const [currentVolume, setCurrentVolume] = useState<number>(getVolumeFromLS());

  const currentUser = useAppSelector((state) => state.users.user);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const currentUserAudio = currentUser.audios.find((a) => a.current);
    const currentAudio = currentUserAudio
      ? new Audio(currentUserAudio.url)
      : new Audio(defaultAudioUrl);
    currentAudio.volume = getSafeVolume(currentVolume);

    currentAudioRef.current = currentAudio;
  }, [currentUser?.audios]);

  useEffect(() => {
    currentAudioRef.current.volume = getSafeVolume(currentVolume);
  }, [currentVolume]);

  const updateVolume = (newVolume: number) => {
    setVolumeInLS(newVolume);
    setCurrentVolume(newVolume);
  };

  const playAudio = () => {
    currentAudioRef.current.currentTime = 0;
    currentAudioRef.current.play();
  };

  const stopAudio = () => {
    currentAudioRef.current.pause();
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentAudio: currentAudioRef.current,
        currentVolume,
        updateVolume,
        playAudio,
        stopAudio,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export default AudioPlayerProvider;

export const useAudioPlayer = () => useContext(AudioPlayerContext);
