import { makePlayer } from "@/utils";
import { SetState } from "@pastable/core";
import { atom, useAtom } from "jotai";
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import { atomWithProxy } from "jotai/valtio";
import { useEffect } from "react";
import { proxy, useSnapshot } from "valtio";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { Player } from "./types";
import { useYDocInit, UseYDocProviderMountFn } from "./yjs-utils";

const yDocId = "rpsApp";
const wsUrl = "ws://localhost:1338";
const yDocOptions = { guid: yDocId };
const appYDoc = new Y.Doc(yDocOptions);
const provider = new WebsocketProvider(wsUrl, appYDoc.guid, appYDoc, { connect: false });
const player = makePlayer();

export const appStateAtom = atom({ yDoc: appYDoc, provider });
export const appYDocAtom = atom((get) => get(appStateAtom).yDoc);
export const appYWsProvider = atom((get) => get(appStateAtom).provider);

export const addWsProviderToDoc: UseYDocProviderMountFn = (yDoc) => {
    console.log("connect to a provider with room", yDoc.guid);
    provider.connect();
    provider.awareness.setLocalState(player);

    return () => {
        console.log("disconnect", yDoc.guid);
        provider.destroy();
    };
};
export const useAppYDocInit = () => useYDocInit(appYDocAtom, addWsProviderToDoc);

export const appAwarenessAtom = atom(new Map() as ReturnType<WebsocketProvider["awareness"]["getStates"]>);
export const appLocalAwarenessAtom = atom((get) => get(appAwarenessAtom).get(provider.awareness.clientID) as Player);
export const useAppYAwarenessInit = () => {
    const provider = useAtomValue(appYWsProvider);
    const setAwareness = useUpdateAtom(appAwarenessAtom);

    useEffect(() => {
        provider.awareness.on("update", (...args) => {
            console.log("update", ...args);
            setAwareness(provider.awareness.getStates());
        });

        return () => provider.awareness.destroy();
    }, []);
};
export const useAppYAwareness = () => useAtomValue(appAwarenessAtom);

const presenceProxy = proxy(player);
const presenceAtom = atomWithProxy(presenceProxy);
export const usePresence = () => {
    const [presence, setPresence] = useAtom(presenceAtom);
    const setAwareness: SetState<Player> = (state) => {
        const update = typeof state === "function" ? state(presence) : state;
        provider.awareness.setLocalState(update);
        setPresence(update);
    };

    return [presenceProxy, setAwareness] as const;
};
export const usePresenceSnap = () => useSnapshot(presenceProxy);
