import { FC, useState, useEffect, useRef } from 'react';
import {
  updateActivityGroup,
  deleteActivityGroup,
} from '../api/activityGroupApi';
import {
  updateActivity,
  archiveActivity,
  deleteActivity,
} from '../api/activityApi';
import { getTimeHoursMinutesSeconds } from '../helpers/timeHelpers';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';

import { IActivity } from '../ts/interfaces/Activity/IActivity';
import { IActivityGroup } from '../ts/interfaces/ActivityGroup/IActivityGroup';

import Button from './Button';
import DeleteIcon from '../icons/DeleteIcon';
import EditIcon from '../icons/EditIcon';
import SaveIcon from '../icons/SaveIcon';
import ArchiveIcon from '../icons/ArchiveIcon';
import UnarchiveIcon from '../icons/UnarchiveIcon';
import KebabHorizontalIcon from '../icons/KebabHorizontalIcon';
import SessionCreateModal from './modals/SessionCreateModal';
import Modal from './modals/Modal';
import DropdownMenu from './DropdownMenu';

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

  const isActivity = 'activityGroup' in activityCommon;

  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [startSessionModal, setStartSessionModal] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>(activityCommon.name);

  const [dropdown, setDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

        toast(`Activity ${archived ? 'archived' : 'unarchived'} successfully`, {
          type: 'success',
        });
      } catch (e) {
        toast('A server error occurred while archiving activity', {
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
          ? 'A server error occurred while deleting activity'
          : 'A server error occurred while deleting activity group',
        {
          type: 'error',
        }
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
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity', {
            type: 'error',
          });
        }
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
        if (e instanceof AxiosError) {
          toast(
            e.response
              ? e.response.data
              : 'A server error occurred while updating activity group',
            {
              type: 'error',
            }
          );
        } else {
          toast('A server error occurred while updating activity group', {
            type: 'error',
          });
        }
        setName(activityCommon.name);
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
          title={isActivity ? 'Deleting activity' : 'Deleting activity group'}
          onCloseModal={() => setDeleteModal(false)}
        >
          <p className="text-base/6 dark:text-textDark">
            {isActivity
              ? 'Are you sure you want to delete this activity? Activity sessions will not be included in analytics.'
              : 'Are you sure you want to delete this activity group? Activity group sessions will not be included in analytics.'}
          </p>
          <div className="mt-10 ml-auto w-fit">
            <Button onClick={onDeleteActivityCommon}>
              {isActivity ? 'Delete activity' : 'Delete activity group'}
            </Button>
          </div>
        </Modal>
      )}

      {startSessionModal && (
        <SessionCreateModal
          modalTitle={
            <div>
              <span className="font-bold">{activityCommon.name}</span>: starting
              new session
            </div>
          }
          onCloseModal={() => {
            setStartSessionModal(false);
          }}
          defaultActivity={activityCommon.id}
          afterSubmitHandler={afterCreateSessionHandler}
        />
      )}

      <div className="p-5 bg-surfaceLight dark:bg-surfaceDark border border-gray-300/80 dark:border-gray-500 border-solid rounded-xl w-[320px] min-h-[150px] flex flex-col">
        <div className="flex items-start justify-between flex-1 gap-5">
          <input
            value={name}
            onChange={inputChangeHandler}
            onBlur={editButtonClickHandler}
            className={`w-full border border-solid rounded-lg bg-transparent text-base p-0.5 text-primary dark:text-textDark ${
              isEditing
                ? 'border-gray-300 dark:border-gray-500'
                : 'border-transparent text-ellipsis'
            }`}
            minLength={1}
            maxLength={50}
            disabled={!isEditing}
          />

          <div className="flex gap-2">
            <button
              className="p-1 transition duration-300 rounded-lg hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
              onClick={editButtonClickHandler}
              title="Edit"
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

                {dropdown && (
                  <DropdownMenu ref={dropdownRef}>
                    <div className="flex flex-col gap-1.5">
                      <button
                        className="flex items-center justify-between px-1.5 py-1 text-left transition duration-300 rounded-lg gap-7 hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover"
                        title="An archived activity will remain in analytics, but you cannot start session with this activity"
                        onClick={() => {
                          setDropdown(false);
                          archiveButtonClickHandler(!activityCommon.archived);
                        }}
                      >
                        {activityCommon.archived ? (
                          <>
                            <div className="w-24 dark:text-textDark">
                              Unarchive
                            </div>
                            <UnarchiveIcon />
                          </>
                        ) : (
                          <>
                            <div className="w-24 dark:text-textDark">
                              Archive
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
                        title="Delete"
                      >
                        <div className="w-24 dark:text-textDark">Delete</div>
                        <DeleteIcon />
                      </button>
                    </div>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <button
                className="p-1 transition duration-300 rounded-lg hover:bg-primaryHover/35 dark:hover:bg-primaryHover/35"
                onClick={deleteButtonClickHandler}
                title="Delete"
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
                <span>Start session</span>
              </Button>
            ) : (
              <Button onClick={() => navigate(`${activityCommon.id}`)}>
                <span>Show activities</span>
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
              sessions
            </div>
          </div>
          <div className="text-center">
            <div className="font-bold dark:text-textDark">
              {getTimeHoursMinutesSeconds(activityCommon.spentTimeSeconds)}
            </div>
            <div className="text-[13px] dark:text-textDarkSecondary">
              spent time
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivityItem;
