import { FC, useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RadioButton from './common/RadioButton';
import PlayIcon from '../icons/PlayIcon';
import PauseIcon from '../icons/PauseIcon';
import DeleteIcon from '../icons/DeleteIcon';
import DownloadIcon from '../icons/DownloadIcon';
import SpeakerWaveIcon from '../icons/SpeakerWaveIcon';
import SpeakerCrossIcon from '../icons/SpeakerCrossIcon';

import { IUserAudio } from '../ts/interfaces/User/IUser';

interface RingtoneItemProps {
  audio: IUserAudio;
  onSelect?: (id: string, newCurrent: boolean) => void;
  onDelete?: (id: string) => void;
  isPlaying: boolean;
  onStartPlaying: (id: string) => void;
  onStopPlaying: (id: string) => void;
}

const RingtoneItem: FC<RingtoneItemProps> = ({
  audio,
  onSelect,
  onDelete,
  isPlaying,
  onStartPlaying,
  onStopPlaying,
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.5);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => setDuration(el.duration);
    const onTimeUpdate = () => setCurrentTime(el.currentTime);
    const onEnded = () => onStopPlaying(audio.id);

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!isPlaying) {
      el.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      onStopPlaying(audio.id);
    } else {
      el.play();
      onStartPlaying(audio.id);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  // TODO: может у меня уже есть какая-то функция, которая так время форматирует?
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggleCurrent = () => {
    if (onSelect) {
      audio.current ? onSelect(audio.id, false) : onSelect(audio.id, true);
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-colors rounded-full bg-surfaceLight dark:bg-surfaceDark hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover">
      <audio ref={audioRef} src={audio.url} preload="metadata" />

      {/* TODO: что с версткой у RadioButton, почему круг не отображается посередине? */}
      <RadioButton isChecked={audio.current} onSelect={toggleCurrent} />

      <button onClick={togglePlay} className="shrink-0">
        {isPlaying ? (
          <PauseIcon className="w-5 h-5 stroke-primary dark:stroke-primary" />
        ) : (
          <PlayIcon className="w-5 h-5 stroke-primary dark:stroke-primary" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate dark:text-textDark">
          {audio.audioName}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-textDarkSecondary">
          <span>{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1 bg-gray-300 rounded dark:bg-surfaceDarkDarker">
            <div
              className="absolute top-0 left-0 h-1 rounded bg-primary"
              style={{
                width: duration ? `${(currentTime / duration) * 100}%` : '0%',
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center w-24 gap-2">
        {volume === 0 ? (
          <SpeakerCrossIcon className="fill-gray-400 dark:fill-gray-400 size-5" />
        ) : (
          <SpeakerWaveIcon className="fill-gray-400 dark:fill-gray-400 size-5" />
        )}
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => handleVolume(+e.target.value)}
          className="w-full accent-primary"
        />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a href={audio.url} download title={t('audioSettings.downloadTitle')}>
          <DownloadIcon className="w-5 h-5 stroke-gray-400 dark:stroke-gray-400 hover:stroke-primary dark:hover:stroke-primary" />
        </a>

        {onDelete && (
          <button
            onClick={() => onDelete(audio.id)}
            title={t('audioSettings.deleteTitle')}
          >
            <DeleteIcon className="w-5 h-5 stroke-gray-400 dark:stroke-gray-400 hover:stroke-primary dark:hover:stroke-primary" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RingtoneItem;
