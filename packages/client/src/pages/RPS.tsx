import { getStateValuePath, parseStateValue, useSharedMachine } from "@/lib";
import { makeRPSMachine } from "@/machine";
import { usePresence, useProviderInit, useYAwareness, useYAwarenessInit, yDoc } from "@/store";
import { Game, Player } from "@/types";
import { getRandomColor, getSaturedColor, makeGame, throttle } from "@/utils";
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
    EditableProps,
    Flex,
    SimpleGrid,
    Spinner,
    SquareProps,
    Stack,
} from "@chakra-ui/react";
import { removeItemMutate } from "@pastable/core";
import { useYArray, useYMap } from "jotai-yjs";
import { useMemo, useState } from "react";
import { useSnapshot } from "valtio";

export const RPS = () => {
    useProviderInit();
    useYAwarenessInit();

    const gamesSource = useYArray<Game>(yDoc, "games");
    const games = useSnapshot(gamesSource);

    const [presence, setPresence] = usePresence();

    const makeNewGame = () => gamesSource.push(makeGame(presence));
    const updateName = (username: Player["username"]) => setPresence((player) => ({ ...player, username }));
    const updateColor = (color: Player["color"]) => setPresence((player) => ({ ...player, color }));
    const handleUpdateColor = throttle((e) => updateColor(e.target.value), 1000);
    const updateRandomColor = () => setPresence((player) => ({ ...player, color: getRandomColor() }));

    if (!presence) {
        return (
            <Center>
                <Spinner />
            </Center>
        );
    }

    return (
        <Stack w="100%">
            <Center flexDir="column" m="8">
                <Stack h="100%">
                    <Stack direction="row" alignItems="center">
                        <chakra.span>(Editable) Username: </chakra.span>
                        <EditableName defaultValue={presence.username} onSubmit={updateName} />
                    </Stack>
                    <input type="color" onChange={handleUpdateColor} />
                    <Button onClick={updateRandomColor}>Random color</Button>
                    <Button onClick={makeNewGame}>New game</Button>
                </Stack>
            </Center>
            <SimpleGrid columns={[1, 1, 2, 3, 3, 4]} w="100%" spacing="8">
                {games.map((game: Game, gameIndex) => {
                    const gameSrc = gamesSource[gameIndex];
                    const gameId = game.id;

                    return <DuelGameWidget key={gameId} game={gameSrc} />;
                })}
            </SimpleGrid>
            <PlayerList />
        </Stack>
    );
};

const PlayerList = () => {
    const awareness = useYAwareness();
    const players = Array.from(awareness.entries()).filter(([_id, player]) => player.id);

    return (
        <Box pos="fixed" top="100px" right="0">
            <Stack>
                {players.map(([id, presence]) => (
                    <Box key={id} py="2" px="4" w="150px" bgColor={presence.color} pos="relative">
                        <Box
                            pos="absolute"
                            top="0"
                            right="100%"
                            h="100%"
                            w="20px"
                            bgColor={getSaturedColor(presence.color)}
                        />
                        <chakra.span color="black">{presence.username}</chakra.span>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

const DuelGameWidget = ({ game }: { game: Game }) => {
    const gameSnap = useSnapshot(game);
    const [hostPlayer, opponentPlayer] = gameSnap.players || [];

    const gameList = useYArray<Game>(yDoc, "games");
    const deleteGame = () => removeItemMutate(gameList, "id", game.id);
    const [presence] = usePresence();

    const [initialState] = useState(() => (game.state ? { state: parseStateValue(game.state) } : undefined));
    const [state, send] = useSharedMachine(game, () => makeRPSMachine(yDoc.guid, game.id), initialState);

    const joinGame = () => {
        if (game.players.some((player) => player.id === presence.id)) return;
        game.players.push(presence);
        send({ type: "JOIN" });
    };

    const stateValue = useMemo(() => getStateValuePath(state), [state.value]);
    console.log(`render game#${game.id} [${stateValue}]`, game);

    const onVSClick = () => {
        if (state.matches("ready")) {
            return send("START");
        }
        if (state.matches("done")) {
            return send("RESTART");
        }
    };
    const isHost = presence.id === hostPlayer.id;

    return (
        <Flex bgColor="gray.400" w="100%" h="200px" p="15px" rounded={8} pos="relative">
            {<CloseButton pos="absolute" bottom="100%" left="100%" bgColor="gray.100" onClick={deleteGame} />}
            <PlayerSlot>
                <PlayerSlotContent player={hostPlayer} />
            </PlayerSlot>
            <Center w="80px" flexShrink={0} flexDir="column">
                <chakra.span color="white" zIndex="10">
                    {game.id}
                </chakra.span>
                <span>{stateValue}</span>
                <VsCircle onClick={onVSClick} cursor="pointer" />
            </Center>
            <PlayerSlot>
                {opponentPlayer ? (
                    <PlayerSlotContent player={opponentPlayer} />
                ) : isHost ? (
                    <PlayerSlotWaitingForOpponent />
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

const PlayerSlotContent = ({ player }: { player: Player }) => {
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

const PlayerSlotWaitingForOpponent = () => {
    return (
        <Center h="100%">
            <Button colorScheme="yellow" disabled h="50px" mx="4" fontSize="sm">
                Waiting for
                <br /> an opponent...
            </Button>
        </Center>
    );
};

const VsCircle = (props: SquareProps) => (
    <Circle size={"40px"} bgColor="gray.300" {...props}>
        {props.children || (
            <chakra.span textTransform="uppercase" color="gray.900" fontSize="small">
                VS
            </chakra.span>
        )}
    </Circle>
);

const EditableName = (props: EditableProps) => {
    return (
        <Editable {...props} textTransform="uppercase">
            <EditablePreview />
            <EditableInput w="12ch" textTransform="uppercase" textAlign="center" />
        </Editable>
    );
};
