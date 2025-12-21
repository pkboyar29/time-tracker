import { FC, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isOutOfRightBoundary } from '../../helpers/htmlHelpers';

interface QuestionMarkTooltipProps {
  tooltipText: string;
}

// TODO: может и за левую границу выходить, если компонент будет располагаться максимально слева (тогда надо не isOutOfRightBoundary использовать)

const QuestionMarkTooltip: FC<QuestionMarkTooltipProps> = ({ tooltipText }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const questionMarkRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const [isOnCenter, setIsOnCenter] = useState<boolean>(true); // TODO: название должно быть связано с границей (либо выезжает за левую границу, либо за правую, либо никуда не выезжает)
  const [top, setTop] = useState<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const hideAndUpdateTop = () => {
      if (isVisible) {
        setIsVisible(false);
        if (questionMarkRef.current) {
          const questionMarkRect =
            questionMarkRef.current.getBoundingClientRect();
          setTop(questionMarkRect.y - 30);
        }
      }
    };

    window.addEventListener('scroll', hideAndUpdateTop, true);
    window.addEventListener('resize', hideAndUpdateTop);
    return () => {
      window.removeEventListener('scroll', hideAndUpdateTop);
      window.removeEventListener('resize', hideAndUpdateTop);
    };
  }, [isVisible]);

  useLayoutEffect(() => {
    if (tooltipRef.current) {
      if (isOutOfRightBoundary(tooltipRef.current)) {
        setIsOnCenter(false);

        if (questionMarkRef.current) {
          const questionMarkRect =
            questionMarkRef.current.getBoundingClientRect();
          setTop(questionMarkRect.y - 30);
        }
      } else {
        setIsOnCenter(true);
      }
    }
  }, []);

  return (
    <div
      className="relative inline-block"
      onPointerEnter={() => setIsVisible(true)}
      onPointerLeave={() => setIsVisible(false)}
    >
      <div
        ref={questionMarkRef}
        className="flex items-center justify-center w-5 h-5 text-sm text-white rounded-full select-none bg-surfaceDarkHover"
      >
        ?
      </div>

      {/* TODO: если тултип выезжает влево, то применять другие свойства */}
      {!isOnCenter &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[100001] px-2 py-1 text-sm text-gray-200 bg-surfaceDarkDarker rounded-md shadow-lg text-center
        ${
          isVisible
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }
      `}
            style={{
              top: top!,
              right: 0,
              maxWidth: 'calc(100vw - 20px)',
            }}
          >
            {tooltipText}
          </div>,
          document.body
        )}

      {isOnCenter && (
        <div
          ref={tooltipRef}
          className={`z-10 px-2 py-1 mb-2 text-sm text-gray-200 rounded-md shadow-lg bg-surfaceDarkDarker text-center absolute bottom-full left-1/2 -translate-x-1/2 max-w-xs w-max
            ${
              isVisible
                ? 'opacity-100 pointer-events-auto'
                : 'opacity-0 pointer-events-none'
            }`}
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
};

export default QuestionMarkTooltip;
