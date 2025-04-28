import Player from "react-material-music-player";
import './player.css';

const AudioPlayer = (props) => {
    return (
        <Player
          // disableDrawer
          sx={{
            left: 0,
          }}
        />
    )
};

export default AudioPlayer;
