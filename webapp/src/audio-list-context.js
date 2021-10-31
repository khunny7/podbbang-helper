import { createContext } from "react";

const AudioListsContext = createContext({
    audioLists: [],
    clearPriorAudioLists: () => {},
    setAudioListsWithClear: () => {},
});

export default AudioListsContext;