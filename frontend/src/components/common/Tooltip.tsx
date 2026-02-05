import {
  FC,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  RefObject,
  ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { isOutOfBoundary } from '../../helpers/htmlHelpers';

interface TooltipProps<T extends HTMLElement> {
  children: (ref: RefObject<T>) => ReactNode;
  tooltipText: string;
}

const TOOLTIP_TOP_OFFSET = 5;
const TOOLTIP_EDGE_OFFSET = 10;

// left - отображается левее (выходило за правую границу), right - отображается правее (выходило за левую границу)
type TooltipPosition = 'center' | 'left' | 'right';

function Tooltip<T extends HTMLElement>({
  tooltipText,
  children,
}: TooltipProps<T>) {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [top, setTop] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);

  const elementRef = useRef<T | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // TODO: убрать?
  useEffect(() => {
    const hide = () => {
      if (!elementRef.current || !tooltipRef.current) return;

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
      if (!elementRef.current || !tooltipRef.current) return;

      const elementRect = elementRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      setTop(elementRect.top - tooltipRect.height - TOOLTIP_TOP_OFFSET);
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
        if (!tooltipRef.current || !elementRef.current) return;
        const tooltipEl = tooltipRef.current;
        const elementEl = elementRef.current;
        const elementRect = elementEl.getBoundingClientRect();
        const tooltipRect = tooltipEl.getBoundingClientRect();

        const centerLeft =
          elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
        const centerRect = { x: centerLeft, width: tooltipRect.width };

        const position: TooltipPosition = isOutOfBoundary(centerRect, 'right')
          ? 'left'
          : isOutOfBoundary(centerRect, 'left')
            ? 'right'
            : 'center';

        setTop(elementRect.top - tooltipRect.height - TOOLTIP_TOP_OFFSET);
        setLeft(
          position === 'center'
            ? centerLeft
            : position === 'left'
              ? window.innerWidth - tooltipRect.width - TOOLTIP_EDGE_OFFSET
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
      {children(elementRef)}

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
}

export default Tooltip;
