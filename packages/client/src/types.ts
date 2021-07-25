export type AwarenessState = { id: string; username: string; color: string };
export interface Player {
    id: string;
    username: string;
    elo: number;
}
export interface Game {
    id: string;
    players: Array<Player>;
    mode: "duel" | "free-for-all";
}
