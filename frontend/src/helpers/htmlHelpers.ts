export function isOutOfRightBoundary(elem: HTMLDivElement) {
  const elemRect = elem.getBoundingClientRect();
  const rootRect = document.getElementById('root')!.getBoundingClientRect();
  return elemRect.x + elemRect.width > rootRect.width;
}
