
import { Track, PlayerInterface } from "react-material-music-player";

const onPlay = (cover, musicSrc, name, singer) => {
  PlayerInterface.play([
    new Track(
      musicSrc,
      cover,
      name,
      singer,
      musicSrc
    ),
  ]);
};

const onAddAudio = (cover, musicSrc, name, singer) => {
  PlayerInterface.playLater([
    new Track(
      musicSrc,
      cover,
      name,
      singer,
      musicSrc
    ),
  ]);
};

export { onPlay, onAddAudio };
