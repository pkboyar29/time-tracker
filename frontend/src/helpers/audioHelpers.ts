import audioUrl from '../assets/audio.mp3';

const audio = new Audio(audioUrl);
audio.volume = 0.35;

const playAudio = () => {
  audio.currentTime = 0;
  audio.play();
};

export { playAudio };
