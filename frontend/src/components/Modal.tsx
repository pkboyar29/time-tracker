import { FC, ReactNode, useEffect } from 'react';

interface ModalProps {
  children: ReactNode;
  title: ReactNode;
  onCloseModal: () => void;
}

const Modal: FC<ModalProps> = ({ children, title, onCloseModal }) => {
  useEffect(() => {
    document.body.classList.add('modal-open');

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleOutsideClick = () => {
    onCloseModal();
  };

  const handleInsideClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    event.stopPropagation();
  };

  return (
    <div
      onClick={handleOutsideClick}
      className="fixed top-0 left-0 z-50 flex items-center justify-center w-full h-full bg-gray-rgba"
    >
      <div
        onClick={handleInsideClick}
        className="px-3 py-5 overflow-hidden bg-white rounded-md basis-1/3"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="text-lg">{title}</div>
          <button onClick={onCloseModal}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
