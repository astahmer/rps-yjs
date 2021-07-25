import { useYArray, useYAwareness, useYDoc } from "zustand-yjs";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import {
    Box,
    Button,
    Center,
    chakra,
    Circle,
    CloseButton,
    Editable,
    EditableInput,
    EditablePreview,
    Flex,
    SimpleGrid,
    Stack,
    useForceUpdate,
} from "@chakra-ui/react";
import { AnyFunction, getRandomIntIn } from "@pastable/core";
import { nanoid } from "nanoid";
import { useMemo } from "react";
import { useEffect } from "react";
import { rainbow } from "@/utils";
import create from "zustand";

const wsUrl = "ws://localhost:1338";
const connectDoc = (yDoc: Y.Doc) => {
    console.log("connect to a provider with room", yDoc.guid);
    const provider = new WebsocketProvider(wsUrl, yDoc.guid, yDoc);
    const id = makeId();
    provider.awareness.setLocalState({ id, username: makeUsername(), color: rainbow(getRandomIntIn(100) % 999) });
    // provider.awareness.

    return () => {
        console.log("disconnect", yDoc.guid);
        provider.destroy();
    };
};

type AwarenessState = { id: string; username: string; color: string };
interface Player {
    id: string;
    username: string;
    elo: number;
}
interface Game {
    id: string;
    players: Y.Array<Player>;
    mode: "duel" | "free-for-all";
}
const makeId = () => nanoid(12);
const makeUsername = () => nanoid(getRandomIntIn(4, 10));
const makePlayer = (): Player => ({
    id: makeId(),
    username: makeUsername(),
    elo: getRandomIntIn(0, 2200),
});
const makeGame = (players: Y.Array<Player>): Y.Map<Game> =>
    new Y.Map(Object.entries({ id: makeId(), players, mode: "duel" }));

const yDocId = "myDocGuid";
const useStore = create(() => ({ id: makeId() }));

export const RPS = () => {
    const yDoc = useYDoc(yDocId, connectDoc);
    const games = useYArray<Y.Map<Game>>(yDoc.getArray("games"));
    console.log(games);
    // const usernames = useYArray<Player>(yDoc.getArray("players"));

    return (
        <Stack w="100%">
            <Center flexDir="column" m="8">
                <NewGameButton games={games} />
            </Center>
            <SimpleGrid columns={[1, 2, 2, 3, 3, 4]} w="100%" spacing="8">
                {games.map((game: Y.Map<Game>, gameIndex) => {
                    const players = getGamePlayers(game);
                    const [hostPlayer, opponentPlayer] = [...players.toArray()];
                    console.log([hostPlayer, opponentPlayer]);
                    const gameId = game.get("id") as any as Game["id"];

                    return (
                        <DuelGameWidget
                            key={gameId}
                            yDoc={yDoc}
                            players={players}
                            gameIndex={gameIndex}
                            // hostPlayer={hostPlayer}
                            // opponentPlayer={opponentPlayer}
                        />
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
};

const usePresence = (yDoc) => {
    const [awareness, setAwarenessData] = useYAwareness<AwarenessState>(yDoc);
    // awareness.ge
};

const EditableName = ({ yDoc }) => {
    const [awareness, setAwarenessData] = useYAwareness<AwarenessState>(yDoc);
    const presence = usePresence(yDoc);
    return (
        <Editable defaultValue={""}>
            <EditablePreview />
            <EditableInput />
        </Editable>
    );
};

const NewGameButton = ({ games }) => {
    const makeNewGame = () => {
        const players = new Y.Array<Player>();
        const game = makeGame(players);
        players.push([makePlayer()]);
        games.push([game]);
    };

    return <Button onClick={makeNewGame}>New game</Button>;
};

const getGamePlayers = (game: Y.Map<Game>) => game.get("players") as any as Y.Array<Player>;

const useYObserver = (yThing: Y.Array<any> | Y.Map<any>, callback?: AnyFunction) => {
    const forceUpdate = useForceUpdate();
    useEffect(() => {
        const handler = (...args) => {
            forceUpdate();
            callback?.(...args);
        };
        yThing.observe(handler);
        return () => yThing.unobserve(handler);
    }, []);
};

const DuelGameWidget = ({ yDoc, gameIndex, players }) => {
    const games = useYArray<Y.Map<Game>>(yDoc.getArray("games"));
    const currentGame = useMemo(() => games.get(gameIndex), [games]);

    useYObserver(players);

    const playersData = players.toArray();
    console.log(currentGame, players, playersData);
    const [hostPlayer, opponentPlayer] = playersData || [];

    const deleteGame = () => games.delete(gameIndex);
    const joinGame = () => {
        const players = getGamePlayers(currentGame);
        players.push([makePlayer()]);
        console.log(players);
    };

    return (
        <Flex columns={3} bgColor="gray.400" w="100%" h="200px" p="15px" rounded={8} pos="relative">
            <CloseButton pos="absolute" bottom="100%" left="100%" bgColor="gray.100" onClick={deleteGame} />
            <PlayerSlot>
                <PlayerSlotContent player={hostPlayer} />
            </PlayerSlot>
            <Center w="80px" flexShrink={0}>
                <VsCircle />
            </Center>
            <PlayerSlot>
                {opponentPlayer ? (
                    <PlayerSlotContent player={opponentPlayer} />
                ) : (
                    <PlayerSlotJoinGame onJoin={joinGame} />
                )}
            </PlayerSlot>
        </Flex>
    );
};

const PlayerSlot = ({ children }) => (
    <Box w="100%" bgColor="gray.600" rounded={8}>
        {children}
    </Box>
);

const PlayerSlotContent = ({ player }) => {
    return (
        <Stack justifyContent="center" alignItems="center" h="100%" spacing="1">
            <Circle size={"65px"} bgColor="gray.300" />
            <chakra.span textTransform="uppercase" color="gray.300">
                {player.username}
            </chakra.span>
            <chakra.span textTransform="uppercase" color="gray.300" fontSize="small">
                {player.elo} ELO
            </chakra.span>
        </Stack>
    );
};

const PlayerSlotJoinGame = ({ onJoin }) => {
    return (
        <Center h="100%">
            <Button colorScheme="yellow" onClick={onJoin}>
                Join game
            </Button>
        </Center>
    );
};

const VsCircle = () => (
    <Circle size={"40px"} bgColor="gray.300">
        <chakra.span textTransform="uppercase" color="gray.900" fontSize="small">
            VS
        </chakra.span>
    </Circle>
);
