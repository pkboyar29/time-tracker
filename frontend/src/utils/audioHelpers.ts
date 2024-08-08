import audioUrl from '../assets/audio.mp3';

export const playAudio = (volume: number = 0.35) => {
  const audio = new Audio(audioUrl);
  audio.volume = volume;
  audio.play();
};
