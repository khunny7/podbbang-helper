import { createContext } from "react";

const AudioListsContext = createContext({
    audioLists: [],
    setAudioLists: () => {},
});

export default AudioListsContext;