export function isOutOfRightBoundary(elem: HTMLDivElement) {
  const elemRect = elem.getBoundingClientRect();
  const rootRect = document.getElementById('root')!.getBoundingClientRect();
  return elemRect.x + elemRect.width > rootRect.width;
}

export function animateCountUp(
  element: HTMLElement,
  to: number,
  duration = 1000,
  formatter: ((v: number) => string) | null,
  additionalText?: string
) {
  const startTime = performance.now();

  function update(now: number) {
    const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
    const value = Math.floor(progress * to);

    if (formatter) {
      element.textContent = formatter(value);
    } else {
      element.textContent = additionalText
        ? `${value.toString()} ${additionalText}`
        : value.toString();
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

export function animateCountUpWithInterval(
  element: HTMLElement,
  to: number,
  duration = 1000,
  initialProgress = 0,
  formatter: ((v: number) => string) | null,
  additionalText?: string
) {
  const interval = 50;

  let animationDuration = duration;
  let msCounter = 0;

  if (initialProgress < 0 || initialProgress > 0.95) {
    throw new Error('Initial progress range should be from 0 to 0.95');
  }
  if (initialProgress != 0) {
    msCounter = initialProgress * duration;
    animationDuration = duration + initialProgress * duration;
  }

  const intervalId = setInterval(() => {
    msCounter += interval;
    const progress = msCounter / animationDuration;
    const value = Math.floor(progress * to);

    if (formatter) {
      element.textContent = formatter(value);
    } else {
      element.textContent = additionalText
        ? `${value.toString()} ${additionalText}`
        : value.toString();
    }

    if (msCounter >= animationDuration) {
      clearInterval(intervalId);
    }
  }, interval);
}
