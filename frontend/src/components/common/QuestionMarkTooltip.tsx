import { FC, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { isOutOfBoundary } from '../../helpers/htmlHelpers';

interface QuestionMarkTooltipProps {
  tooltipText: string;
}

// left - отображается левее (выходило за правую границу), right - отображается правее (выходило за левую границу)
type TooltipPosition = 'center' | 'left' | 'right';

const QuestionMarkTooltip: FC<QuestionMarkTooltipProps> = ({ tooltipText }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [top, setTop] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);

  const questionMarkRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // TODO: убрать?
  useEffect(() => {
    const hide = () => {
      if (!questionMarkRef.current || !tooltipRef.current) return;

      if (isVisible) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', hide);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide);
      window.removeEventListener('resize', hide);
    };
  }, [isVisible]);

  useEffect(() => {
    const updateTop = () => {
      if (!questionMarkRef.current || !tooltipRef.current) return;

      const questionMarkRect = questionMarkRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setTop(questionMarkRect.top - tooltipRect.height);
    };

    window.addEventListener('scroll', updateTop, true);
    window.addEventListener('resize', updateTop);
    return () => {
      window.removeEventListener('scroll', updateTop);
      window.removeEventListener('resize', updateTop);
    };
  }, []);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!tooltipRef.current || !questionMarkRef.current) return;
        const tooltipEl = tooltipRef.current;
        const questionMarkEl = questionMarkRef.current;
        const questionMarkRect = questionMarkEl.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        const centerLeft =
          questionMarkRect.left +
          questionMarkRect.width / 2 -
          tooltipRect.width / 2;
        const centerRect = { x: centerLeft, width: tooltipRect.width };

        const position: TooltipPosition = isOutOfBoundary(centerRect, 'right')
          ? 'left'
          : isOutOfBoundary(centerRect, 'left')
            ? 'right'
            : 'center';

        setTop(questionMarkRect.top - tooltipRect.height);
        setLeft(
          position === 'center'
            ? centerLeft
            : position === 'left'
              ? window.innerWidth - tooltipRect.width - 10
              : 10,
        );
      });
    });
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

      {createPortal(
        <div
          ref={tooltipRef}
          className={`fixed z-[100001] max-w-[280px] px-2 py-1 text-sm text-gray-200 bg-surfaceDarkDarker rounded-md shadow-lg text-center ${
            isVisible
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          }`}
          style={{
            top,
            left,
          }}
        >
          {tooltipText}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default QuestionMarkTooltip;
