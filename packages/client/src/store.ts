import { getRandomColor, makeId, makeUsername } from "@/utils";
import { atom } from "jotai";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { useYDocProvider } from "./yjs-utils";

const yDocId = "rpsApp";
const wsUrl = "ws://localhost:1338";

export const appYDocAtom = atom(new Y.Doc({ guid: yDocId }));
export const addWsProviderToDoc = (yDoc: Y.Doc) => {
    console.log("connect to a provider with room", yDoc.guid);
    const provider = new WebsocketProvider(wsUrl, yDoc.guid, yDoc);
    const id = makeId();
    provider.awareness.setLocalState({ id, username: makeUsername(), color: getRandomColor() });

    return () => {
        console.log("disconnect", yDoc.guid);
        provider.destroy();
    };
};
export const useAppYDoc = () => useYDocProvider(appYDocAtom, addWsProviderToDoc);
