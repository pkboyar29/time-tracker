export const getRemainingTimeMinutesSeconds = (totalTimeSeconds: number, spentTimeSeconds: number): string => {
   const remainingSeconds = totalTimeSeconds - spentTimeSeconds
   const minutes = Math.trunc((remainingSeconds) / 60)
   const seconds = ((remainingSeconds) % 60) < 10 ? '0' + (remainingSeconds) % 60 : (remainingSeconds) % 60
   return `${minutes}:${seconds}`
}
