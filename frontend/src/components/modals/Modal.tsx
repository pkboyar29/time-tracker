import { FC, ReactNode, useEffect, useRef } from 'react';

import CrossIcon from '../../icons/CrossIcon';

interface ModalProps {
  children: ReactNode;
  title: ReactNode;
  onCloseModal: () => void;
}

const Modal: FC<ModalProps> = ({ children, title, onCloseModal }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMouseDownInside = useRef<boolean>(false);

  useEffect(() => {
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleMouseDown = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (modalRef.current?.contains(event.target as Node)) {
      isMouseDownInside.current = true;
    } else {
      isMouseDownInside.current = false;
    }
  };

  const handleMouseUp = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (
      !isMouseDownInside.current &&
      !modalRef.current?.contains(event.target as Node)
    ) {
      onCloseModal();
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      className="fixed top-0 left-0 z-[100000] flex items-center justify-center w-full h-full bg-modalBackgroundLight dark:bg-modalBackgroundDark"
    >
      <div
        ref={modalRef}
        className="px-3 py-5 overflow-hidden border border-solid rounded-md bg-surfaceLight dark:bg-surfaceDark basis-1/3 border-gray-300/80 dark:border-gray-500"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg dark:text-textDark">{title}</div>

          <button
            className="p-1.5 transition duration-300 hover:bg-surfaceLightHover dark:hover:bg-surfaceDarkHover rounded-full"
            onClick={onCloseModal}
          >
            <CrossIcon />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Modal;
