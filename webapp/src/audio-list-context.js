import { createContext } from "react";

const AudioListsContext = createContext({
    audioLists: [],
    addAudio: () => {},
    playAudio: () => {},
});

export default AudioListsContext;