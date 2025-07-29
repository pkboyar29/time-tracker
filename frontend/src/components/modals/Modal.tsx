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
      className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-gray-rgba"
    >
      <div
        ref={modalRef}
        className="px-3 py-5 overflow-hidden bg-white rounded-md basis-1/3"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg">{title}</div>
          <button onClick={onCloseModal}>
            <CrossIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
