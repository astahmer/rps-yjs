import { ObjectLiteral } from "@pastable/core";
import { Atom, atom } from "jotai";
import { atomFamily, useAtomValue } from "jotai/utils";
import { useEffect } from "react";
import { proxy } from "valtio";
import { bindProxyAndYArray, bindProxyAndYMap } from "valtio-yjs";
import * as Y from "yjs";

export const useYDocProvider = (yDocAtom: Atom<Y.Doc>, onMount: (yDoc: Y.Doc) => (yDoc: Y.Doc) => void) => {
    const yDoc = useAtomValue(yDocAtom);

    useEffect(() => {
        const unmount = onMount(yDoc);

        return () => {
            unmount(yDoc);
        };
    }, []);

    return yDoc;
};
export const useYDocValue = (yDocAtom: Atom<Y.Doc>) => useAtomValue(yDocAtom);

const yArrayAtomFamily = atomFamily(
    ({ defaultValue }: { name: string; defaultValue: any[] }) => atom(proxy(defaultValue)),
    (a, b) => a.name === b.name
);
export function useYArray<T = any>(yDoc: Y.Doc, name: string): Array<T> {
    const yArray = yDoc.getArray<T>(name);
    const defaultValue = yArray.toArray() as Array<T>;
    const source = useAtomValue(yArrayAtomFamily({ name, defaultValue }));

    useEffect(() => {
        bindProxyAndYArray(source, yArray);
    }, []);

    return source;
}

const yMapAtomFamily = atomFamily(
    ({ defaultValue }: { name: string; defaultValue: ObjectLiteral }) => atom(proxy(defaultValue)),
    (a, b) => a.name === b.name
);
export function useYMap<T extends ObjectLiteral = ObjectLiteral>(yDoc: Y.Doc, name: string): T {
    const yMap = yDoc.getMap(name) as Y.Map<T>;
    const defaultValue = yMap.toJSON() as T;
    const source = useAtomValue(yMapAtomFamily({ name, defaultValue }));

    useEffect(() => {
        bindProxyAndYMap(source, yMap);
    }, []);

    return source as T;
}
