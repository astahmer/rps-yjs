import { createMachine } from "xstate";
import * as Y from "yjs";
import { Game } from "./types";

// import { inspect } from "@xstate/inspect";
// inspect({ url: "https://stately.ai/viz", iframe: false });
// inspect({ url: "https://statecharts.io/inspect", iframe: false });

export const makeRPSMachine = (yDocId: Y.Doc["guid"], gameId: Game["id"]) =>
    createMachine(
        {
            initial: "waiting",
            context: { yDocId, gameId },
            // context: { game, deleteGame },
            states: {
                waiting: {
                    // entry: "log",
                    // always: { target: "ready", cond: "isReady" }
                    on: { JOIN: { target: "ready" } },
                },
                ready: {
                    // entry: "log",
                    on: { START: { target: "playing" } },
                },
                playing: {
                    // entry: "log",
                    after: { 2000: { target: "done" } },
                },
                done: {
                    // entry: "log",
                    on: { RESTART: { target: "ready" } },
                },
            },
            on: { LOG: { actions: "log" }, DELETE: { actions: "delete" } },
        },
        {
            actions: {
                // log: (ctx) => console.log(ctx),
                // joinTheGame,
                // join: (_ctx, event) => event.game.players.push(event.player),
                // delete: () => deleteGame(),
                delete: () => {},
            },
            // guards: {
            //     isReady: (ctx, event) => ctx.
            // }
        }
    );
