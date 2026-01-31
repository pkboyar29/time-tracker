import { FC, useState } from 'react';
import {
  updateActivityGroup,
  deleteActivityGroup,
} from '../api/activityGroupApi';
import {
  updateActivity,
  archiveActivity,
  updateActivityColor,
  deleteActivity,
} from '../api/activityApi';
import { getTimeHMS } from '../helpers/timeHelpers';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';

import Button from './common/Button';
import DeleteIcon from '../icons/DeleteIcon';
import EditIcon from '../icons/EditIcon';
import SaveIcon from '../icons/SaveIcon';
import ArchiveIcon from '../icons/ArchiveIcon';
import UnarchiveIcon from '../icons/UnarchiveIcon';
import KebabHorizontalIcon from '../icons/KebabHorizontalIcon';
import SessionCreateModal from './modals/SessionCreateModal';
import Modal from './modals/Modal';
import DropdownMenu from './common/DropdownMenu';

interface ActivityBoxProps {
  activityCommon: IActivity | IActivityGroup;
  afterUpdateHandler: (updatedActivity: IActivity | IActivityGroup) => void;
  afterDeleteHandler: (deletedActivityCommonId: string) => void;
}

const ActivityItem: FC<ActivityBoxProps> = ({
  activityCommon,
  afterUpdateHandler,
  afterDeleteHandler,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isActivity = 'activityGroup' in activityCommon;

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [startSessionModal, setStartSessionModal] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(activityCommon.name);

  const [color, setColor] = useState<string>(
    isActivity ? activityCommon.color : '',
  );

  const [dropdown, setDropdown] = useState<boolean>(false);

  const inputChangeHandler = async (e: React.FormEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value);
  };

  const editButtonClickHandler = () => {
    if (isEditing && name != activityCommon.name) {
      onUpdateActivityCommon();
    }

    setIsEditing((prev) => !prev);
  };

  const archiveButtonClickHandler = async (archived: boolean) => {
    if (isActivity) {
      try {
        await archiveActivity({ id: activityCommon.id, archived });

        afterUpdateHandler({ ...activityCommon, archived });

        toast(
          archived
            ? t('activityItem.successfulArchive')
            : t('activityItem.successfulUnarchive'),
          {
            type: 'success',
          },
        );
      } catch (e) {
        toast(t('serverErrors.archiveActivity'), {
          type: 'error',
        });
      }
    }
  };

  const deleteButtonClickHandler = () => {
    setDeleteModal(true);
  };

  const onDeleteActivityCommon = async () => {
    try {
      if (isActivity) {
        await deleteActivity(activityCommon.id);
      } else {
        await deleteActivityGroup(activityCommon.id);
      }
      afterDeleteHandler(activityCommon.id);
      setDeleteModal(false);
    } catch (e) {
      toast(
        isActivity
          ? t('serverErrors.deleteActivity')
          : t('serverErrors.deleteGroup'),
        {
          type: 'error',
        },
      );
    }
  };

  const onUpdateActivityCommon = async () => {
    if (isActivity) {
      try {
        const updatedData = await updateActivity({
          id: activityCommon.id,
          name,
        });

        afterUpdateHandler(updatedData);
      } catch (e) {
        toast(t('serverErrors.updateActivity'), { type: 'error' });
        setName(activityCommon.name);
      }
    } else {
      try {
        const updatedData = await updateActivityGroup({
          id: activityCommon.id,
          name,
        });

        afterUpdateHandler(updatedData);
      } catch (e) {
        toast(t('serverErrors.updateGroup'), { type: 'error' });
        setName(activityCommon.name);
      }
    }
  };

  const onColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  const onColorInputBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    if (isActivity && activityCommon.color !== color) {
      try {
        const updatedData = await updateActivityColor({
          id: activityCommon.id,
          color,
        });

        afterUpdateHandler(updatedData);
      } catch (e) {
        toast(t('serverErrors.updateActivityColor'), { type: 'error' });
      }
    }
  };

  const afterCreateSessionHandler = () => {
    navigate('/timer');
  };

  return (
    <>
      {deleteModal && (
        <Modal
          title={
            isActivity
              ? t('deleteActivityModal.title')
              : t('deleteGroupModal.title')
          }
          onCloseModal={() => setDeleteModal(false)}
        >
          <p className="text-base/6 dark:text-textDark">
            {isActivity
              ? t('deleteActivityModal.descr')
              : t('deleteGroupModal.descr')}
          </p>
          <div className="mt-10 ml-auto w-fit">
            <Button onClick={onDeleteActivityCommon}>
              {isActivity
                ? t('deleteActivityModal.button')
                : t('deleteGroupModal.button')}
            </Button>
          </div>
        </Modal>
      )}

      {startSessionModal && (
        <SessionCreateModal
          modalTitle={
            <div>
              <span className="font-bold">{activityCommon.name}</span>:{' '}
              {t('createSessionModal.title')}
            </div>
          }
          onCloseModal={() => {
            setStartSessionModal(false);
          }}
          defaultActivity={activityCommon.id}
          afterSubmitHandler={afterCreateSessionHandler}
        />
      )}

      <div className="p-5 bg-surfaceLight dark:bg-surfaceDark border border-gray-300/80 dark:border-white/10 border-solid rounded-xl w-[320px] min-h-[150px] flex flex-col">
        <div className="flex items-start justify-between flex-1 gap-4">
          <div className="flex items-center gap-2">
            {isActivity && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: activityCommon.color }}
              />
            )}

            <input
              value={name}
              onChange={inputChangeHandler}
              onBlur={editButtonClickHandler}
              className={`w-full border border-solid rounded-lg bg-transparent text-base p-0.5 dark:text-textDark ${
                isEditing
                  ? 'border-gray-300 dark:border-white/10'
                  : 'border-transparent text-ellipsis'
              }`}
              minLength={1}
              maxLength={50}
              disabled={!isEditing}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={editButtonClickHandler}
              title={t('activityItem.editTooltip')}
            >
              {isEditing ? <SaveIcon /> : <EditIcon />}
            </button>
            {isActivity ? (
              <div className="relative">
                <button
                  onClick={() => setDropdown((dropdown) => !dropdown)}
                  className={`p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover ${
                    dropdown && 'bg-surfaceLightHover dark:bg-surfaceDarkHover'
                  }`}
                >
                  <KebabHorizontalIcon />
                </button>

                <DropdownMenu dropdown={dropdown} setDropdown={setDropdown}>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`color:${activityCommon.id}`}
                      title={t('activityItem.colorTooltip')}
                      className="cursor-pointer flex items-center justify-between px-1.5 py-1 text-left transition duration-300 rounded-lg gap-7 hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
                    >
                      <div className="truncate w-28 dark:text-textDark">
                        {t('activityItem.colorTitle')}
                      </div>

                      <div className="w-6 h-6 overflow-hidden rounded-md">
                        <input
                          id={`color:${activityCommon.id}`}
                          type="color"
                          className="w-full h-full p-0 border-none cursor-pointer dark:bg-surfaceDark"
                          value={color}
                          onChange={onColorInputChange}
                          onBlur={onColorInputBlur}
                        />
                      </div>
                    </label>

                    <button
                      className="flex items-center justify-between px-1.5 py-1 text-left transition duration-300 rounded-lg gap-7 hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
                      title={t('activityItem.archiveTooltip')}
                      onClick={() => {
                        setDropdown(false);
                        archiveButtonClickHandler(!activityCommon.archived);
                      }}
                    >
                      {activityCommon.archived ? (
                        <>
                          <div className="truncate w-28 dark:text-textDark">
                            {t('activityItem.unarchiveTitle')}
                          </div>
                          <UnarchiveIcon />
                        </>
                      ) : (
                        <>
                          <div className="truncate w-28 dark:text-textDark">
                            {t('activityItem.archiveTitle')}
                          </div>
                          <ArchiveIcon />
                        </>
                      )}
                    </button>

                    <button
                      className="flex items-center justify-between px-1.5 py-1 text-left transition duration-300 rounded-lg gap-7 hover:bg-primaryHover/35 dark:hover:bg-primaryHover/35"
                      onClick={() => {
                        setDropdown(false);
                        deleteButtonClickHandler();
                      }}
                      title={t('activityItem.deleteTooltip')}
                    >
                      <div className="truncate w-28 dark:text-textDark">
                        {t('activityItem.deleteTitle')}
                      </div>
                      <DeleteIcon />
                    </button>
                  </div>
                </DropdownMenu>
              </div>
            ) : (
              <button
                className="p-1 transition duration-300 rounded-lg hover:bg-primaryHover/35 dark:hover:bg-primaryHover/35"
                onClick={deleteButtonClickHandler}
                title={t('activityItem.deleteTooltip')}
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <div className="w-fit">
            {isActivity ? (
              <Button
                disabled={activityCommon.archived}
                onClick={() => setStartSessionModal(true)}
              >
                <span>{t('activityItem.startSessionButton')}</span>
              </Button>
            ) : (
              <Button onClick={() => navigate(`${activityCommon.id}`)}>
                <span>{t('activityItem.showActivitiesButton')}</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <div className="font-bold dark:text-textDark">
              {activityCommon.sessionsAmount}
            </div>
            <div className="text-[13px] dark:text-textDarkSecondary">
              {t('activityItem.sessions')}
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold dark:text-textDark">
              {getTimeHMS(activityCommon.spentTimeSeconds)}
            </div>
            <div className="text-[13px] dark:text-textDarkSecondary">
              {t('activityItem.spentTime')}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityItem;
