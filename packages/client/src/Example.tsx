import React, { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { useYDoc, useYArray, useYMap, StartAwarenessFunction, useYAwareness } from "zustand-yjs";
import { WebsocketProvider } from "y-websocket";
import { Box, useEventListener } from "@chakra-ui/react";
import { AnyFunction } from "xstate/lib/model.types";
import { useRef } from "react";

// Taken from https://github.com/tandem-pt/zustand-yjs/blob/d5405321163a94496226208382ef949afd4b1621/example/src/App.tsx
// Added live cursors through awareness

export function Example() {
    return (
        <div className="Example">
            <AddMember />
            <Members />
        </div>
    );
}

const wsUrl = window.location.hostname === "localhost" ? "ws://localhost:1338" : "wss://y.svelt-yjs.dev";

const ID = +new Date();
type AwarenessState = {
    ID: number;
    color: string;
    elementIndex: number | null;
    position: { x: number; y: number } | null;
    windowSize: { innerWidth: number; innerHeight: number } | null;
};

const getWindowSize = () => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight });

const connectMembers = (yDoc: Y.Doc, startAwareness: StartAwarenessFunction) => {
    console.log("connect ", yDoc.guid);
    const provider = new WebsocketProvider(wsUrl, yDoc.guid, yDoc);
    provider.awareness.setLocalState({
        ID,
        color: rainbow(ID % 999),
        elementIndex: null,
        position: null,
    });
    const updatePosition = (e: MouseEvent) =>
        provider.awareness.setLocalStateField("position", { x: e.clientX, y: e.clientY });
    const moveHandler = throttle((e) => updatePosition(e), 150) as AnyFunction;
    window.addEventListener("mousemove", moveHandler);

    const updateSize = () => provider.awareness.setLocalStateField("windowSize", getWindowSize());
    const sizeHandler = throttle((e) => updateSize(e), 150) as AnyFunction;
    window.addEventListener("resize", sizeHandler);
    updateSize();

    const stopAwareness = startAwareness(provider);
    return () => {
        console.log("disconnect", yDoc.guid);
        stopAwareness();
        provider.destroy();
    };
};

type Member = Y.Map<string>;
type AwarenessProps = {
    yDoc: Y.Doc;
    elementIndex?: number;
};

type AwarenessChipProps = {
    color: string;
};
const AwarenessChip = ({ color }: AwarenessChipProps) => {
    return (
        <span
            style={{
                background: color,
                border: "2px solid #313131",
                borderRadius: "50%",
                display: "inline-block",
                margin: "0 2px",
                minHeight: "8px",
                minWidth: "8px",
            }}
        ></span>
    );
};
const Awareness = ({ yDoc, elementIndex }: AwarenessProps) => {
    const [awarenessData] = useYAwareness<AwarenessState>(yDoc);
    // console.log(awarenessData);
    const colors = useMemo<string[]>(() => {
        if (elementIndex !== null) {
            return awarenessData
                .filter((state) => state?.ID && state.elementIndex === elementIndex)
                .map(({ color }) => color);
        }
        return awarenessData.filter(({ ID }) => !!ID).map(({ color }) => color);
    }, [awarenessData, elementIndex]);

    return (
        <>
            {colors.map((color, index) => {
                return <AwarenessChip color={color} key={index} />;
            })}
        </>
    );
};
type EditMemberProps = {
    yDoc: Y.Doc;
    yMember: Member;
    handleDone: () => void;
    index: number;
};
const EditMember = ({ yDoc, yMember, index, handleDone }: EditMemberProps) => {
    const { set, data } = useYMap<string | number, { username: string }>(yMember);
    const [, setAwarenessData] = useYAwareness<AwarenessState>(yDoc);
    useEffect(() => {
        setAwarenessData({ elementIndex: index });
        return () => {
            setAwarenessData({ elementIndex: null });
        };
    }, [index, setAwarenessData]);
    return (
        <form
            style={{ display: "inline-block" }}
            onSubmit={(e) => {
                e.preventDefault();
                handleDone();
            }}
        >
            <input
                type="text"
                id="Member"
                name="Member"
                autoFocus
                value={data.username}
                style={{ width: 230, display: "inline-block", marginRight: 8 }}
                onChange={({ target }) => {
                    set("username", `${target.value}`);
                }}
            />
            <button type="submit">done</button>
        </form>
    );
};

type MemberDetailProps = React.PropsWithChildren<{
    member: Member;
    onClick: () => void;
}>;
const MemberDetail = ({ member, onClick, children }: MemberDetailProps) => {
    const { get } = useYMap(member);
    return (
        <li onClick={onClick}>
            {children}
            {get("username")}
        </li>
    );
};
const Members = () => {
    // console.log("Members");
    const yDoc = useYDoc("root", connectMembers);
    // console.log(yDoc);
    const [editionIndex, setEditionIndex] = useState<number>(-1);
    const { data, delete: deleteItem } = useYArray<Member>(yDoc.getArray("members"));
    const [awarenessData] = useYAwareness<AwarenessState>(yDoc);
    const me = awarenessData.find(({ ID: userId }) => userId === ID);
    // console.log(awarenessData);

    return (
        <>
            {me && (
                <div style={{ color: me.color, textAlign: "right" }}>
                    <AwarenessChip color={me.color} /> you are connected
                </div>
            )}
            <ul>
                {data.map((yMember: Member, index: number) => {
                    if (editionIndex === index)
                        return (
                            <li key={index}>
                                <Awareness yDoc={yDoc} elementIndex={index} />
                                <EditMember
                                    yDoc={yDoc}
                                    yMember={yMember}
                                    index={index}
                                    handleDone={() => {
                                        if (yMember.get("username") === "") {
                                            deleteItem(editionIndex);
                                        }
                                        setEditionIndex(-1);
                                    }}
                                />
                            </li>
                        );
                    return (
                        <div key={index}>
                            <MemberDetail member={yMember} onClick={() => setEditionIndex(index)}>
                                <Awareness yDoc={yDoc} elementIndex={index} />
                            </MemberDetail>
                        </div>
                    );
                })}
            </ul>
            {data.length > 0 && (
                <small>
                    <em>Click on the member you want to edit</em>
                </small>
            )}
            {awarenessData
                .filter((presence) => presence.ID !== ID)
                .map((presence) => {
                    const selfSize = getWindowSize();
                    const aSize = presence.windowSize;
                    const percents = {
                        innerWidth: selfSize.innerWidth / aSize.innerWidth,
                        innerHeight: selfSize.innerHeight / aSize.innerHeight,
                    };
                    const cursorPosition = {
                        left: (presence.position?.x || 0) * percents.innerWidth,
                        top: (presence.position?.y || 0) * percents.innerHeight,
                    };
                    return (
                        <Cursor
                            key={presence.ID}
                            left={cursorPosition.left}
                            top={cursorPosition.top}
                            color={presence.color}
                        />
                    );
                })}
            {/* <SelfCursor /> */}
        </>
    );
};

const Cursor = ({ left, top, color }) => {
    return <Box pos="absolute" boxSize="10px" left={left} top={top} bgColor={color} transition="all 0.3s ease-out" />;
};

const SelfCursor = () => {
    const ref = useRef<HTMLDivElement>(null);
    useEventListener("mousemove", (e) => {
        if (!ref.current) return;
        ref.current.style.left = e.clientX + "px";
        ref.current.style.top = e.clientY + "px";
        console.log([e.clientX, e.clientY]);
    });

    return <Box ref={ref} pos="absolute" boxSize="10px" bgColor="twitter.500" />;
};

const AddMember = () => {
    // console.log("AddMember");
    const yDoc = useYDoc("root", connectMembers);
    const { push, data } = useYArray<Member>(yDoc.getArray("members"));

    return (
        <button
            className="primary"
            onClick={() => {
                const newMember = new Y.Map<string>();
                console.log("JohnDoe #" + data.length);
                newMember.set("username", "JohnDoe #" + data.length);
                // console.log(newMember);
                push([newMember]);
            }}
        >
            New Member
        </button>
    );
};

function rainbow(step: number, numOfSteps = 1000) {
    // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
    // Adam Cole, 2011-Sept-14
    // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
    let r = 0,
        g = 0,
        b = 0;
    let h = step / numOfSteps;
    let i = ~~(h * 6);
    let f = h * 6 - i;
    let q = 1 - f;
    switch (i % 6) {
        case 0:
            r = 1;
            g = f;
            b = 0;
            break;
        case 1:
            r = q;
            g = 1;
            b = 0;
            break;
        case 2:
            r = 0;
            g = 1;
            b = f;
            break;
        case 3:
            r = 0;
            g = q;
            b = 1;
            break;
        case 4:
            r = f;
            g = 0;
            b = 1;
            break;
        case 5:
            r = 1;
            g = 0;
            b = q;
            break;
    }
    var c =
        "#" +
        ("00" + (~~(r * 255)).toString(16)).slice(-2) +
        ("00" + (~~(g * 255)).toString(16)).slice(-2) +
        ("00" + (~~(b * 255)).toString(16)).slice(-2);
    return c;
}

// https://gist.github.com/beaucharman/e46b8e4d03ef30480d7f4db5a78498ca
function throttle(callback, wait, immediate = false) {
    let timeout = null;
    let initialCall = true;

    return function () {
        const callNow = immediate && initialCall;
        const next = () => {
            callback.apply(this, arguments);
            timeout = null;
        };

        if (callNow) {
            initialCall = false;
            next();
        }

        if (!timeout) {
            timeout = setTimeout(next, wait);
        }
    };
}

// https://github.com/yjs/y-prosemirror/blob/master/src/plugins/cursor-plugin.js
// https://svelt-yjs.dev/ https://github.com/relm-us/svelt-yjs/blob/main/example/src/App.svelte
// https://github.com/yjs/y-websocket/blob/master/README.md
// https://docs.yjs.dev/getting-started/adding-awareness
