import { FC, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/store';
import { useTranslation } from 'react-i18next';
import { setUser } from '../../redux/slices/userSlice';
import { uploadAudio, deleteAudio, updateAudio } from '../../api/userApi';
import { toast } from 'react-toastify';
import defaultAudioUrl from '../../assets/discordSound.mp3';

import UploadIcon from '../../icons/UploadIcon';
import QuestionMarkTooltip from '../common/QuestionMarkTooltip';
import ActionButton from '../common/ActionButton';
import RingtoneItem from '../RingtoneItem';
import PrimaryClipLoader from '../common/PrimaryClipLoader';

const SettingsAudioSection: FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const userInfo = useAppSelector((state) => state.users.user);

  if (!userInfo) {
    return (
      <div className="pb-5 text-center">
        <PrimaryClipLoader />
      </div>
    );
  }

  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  const onUploadAudioButtonClick = () => {
    document.getElementById('audioFileInput')?.click();
  };
  const onAudioFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const newUserAudio = await uploadAudio(file);

      dispatch(
        setUser({ ...userInfo, audios: [...userInfo.audios, newUserAudio] }),
      );
    } catch (e) {
      toast(t('serverErrors.uploadAudio'), { type: 'error' });
    }

    event.target.value = '';
  };

  const onDeleteAudioButtonClick = async (audioId: string) => {
    try {
      await deleteAudio(audioId);

      dispatch(
        setUser({
          ...userInfo,
          audios: userInfo.audios.filter((a) => a.id !== audioId),
        }),
      );
    } catch (e) {
      toast(t('serverErrors.deleteAudio'), { type: 'error' });
    }
  };

  const onSelectAudioButtonClick = async (
    audioId: string,
    newCurrent: boolean,
  ) => {
    try {
      if (audioId === '') {
        if (newCurrent) {
          const selectedAudio = userInfo.audios.find((a) => a.current === true);
          await updateAudio(selectedAudio!.id, false);

          const newUserAudios = userInfo.audios.map((a) => ({
            ...a,
            current: false,
          }));

          dispatch(
            setUser({
              ...userInfo,
              audios: newUserAudios,
            }),
          );
        }
      } else {
        await updateAudio(audioId, newCurrent);

        if (newCurrent) {
          const newUserAudios = userInfo.audios.map((a) => ({
            ...a,
            current: a.id === audioId,
          }));

          dispatch(
            setUser({
              ...userInfo,
              audios: newUserAudios,
            }),
          );
        } else {
          const newUserAudios = userInfo.audios.map((a) => ({
            ...a,
            current: false,
          }));

          dispatch(
            setUser({
              ...userInfo,
              audios: newUserAudios,
            }),
          );
        }
      }
    } catch (e) {
      toast(t('serverErrors.updateAudio'), { type: 'error' });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold tracking-wide text-gray-600 uppercase dark:text-textDarkSecondary">
        {t('audioSettings.default')}
      </h3>

      <RingtoneItem
        audio={{
          id: '',
          audioName: 'discord sound.mp3',
          url: defaultAudioUrl,
          current: !userInfo.audios.some((a) => a.current),
        }}
        onSelect={onSelectAudioButtonClick}
        isPlaying={activeAudioId === ''}
        onStartPlaying={(id) => {
          setActiveAudioId(id);
        }}
        onStopPlaying={() => {
          setActiveAudioId(null);
        }}
      />

      <h3 className="text-sm font-semibold tracking-wide text-gray-600 uppercase dark:text-textDarkSecondary">
        {t('audioSettings.userAudios')}
      </h3>

      <div className="relative w-fit">
        <ActionButton
          disabled={userInfo.audios.length == 5}
          clickHandler={onUploadAudioButtonClick}
          children={
            <div className="flex items-center justify-between gap-2">
              <UploadIcon className="stroke-primary dark:stroke-primary size-5" />
              {t('audioSettings.uploadAudio')}
            </div>
          }
        />
        <input
          accept=".mp3, .m4r, .ogg"
          onChange={onAudioFileInputChange}
          id="audioFileInput"
          type="file"
          className="w-0 opacity-0"
        />

        <div className="absolute pl-0.5 -top-0.5 left-full">
          <QuestionMarkTooltip
            tooltipText={t('audioSettings.uploadAudioConstraints')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 pb-5">
        {userInfo.audios.map((audio) => (
          <RingtoneItem
            key={audio.id}
            audio={audio}
            onSelect={onSelectAudioButtonClick}
            onDelete={onDeleteAudioButtonClick}
            isPlaying={activeAudioId === audio.id}
            onStartPlaying={(id) => {
              setActiveAudioId(id);
            }}
            onStopPlaying={() => {
              setActiveAudioId(null);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsAudioSection;
