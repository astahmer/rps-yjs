import { appYDocAtom, useAppYAwareness, useAppYAwarenessInit, useAppYDocInit, usePresence } from "@/store";
import { Game, Player } from "@/types";
import { makeGame, removeItemObjectMutate } from "@/utils";
import { useYArray, useYDocValue } from "@/yjs-utils";
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
    Stack,
} from "@chakra-ui/react";
import { useSnapshot } from "valtio";

export const RPS = () => {
    const yDoc = useAppYDocInit();
    useAppYAwarenessInit();

    const gamesSource = useYArray<Game>(yDoc, "games");
    const games = useSnapshot(gamesSource);

    const [presence, setPresence] = usePresence();

    const makeNewGame = () => gamesSource.push(makeGame(presence));
    const updateName = (username: Player["username"]) => setPresence((player) => ({ ...player, username }));

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
                        <chakra.span>Username: </chakra.span>
                        <EditableName defaultValue={presence.username} onSubmit={updateName} />
                    </Stack>
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
        </Stack>
    );
};

const DuelGameWidget = ({ game }) => {
    const gameSnap = useSnapshot<Game>(game);
    const [hostPlayer, opponentPlayer] = gameSnap.players || [];
    // console.log(gameSnap);

    const yDoc = useYDocValue(appYDocAtom);
    const gamesSource = useYArray<Game>(yDoc, "games");
    const deleteGame = () => removeItemObjectMutate(gamesSource, "id", game.id);
    const [presence] = usePresence();
    const joinGame = () => game.players.push(presence);
    const isHost = presence.id === hostPlayer.id;
    console.log(isHost, hostPlayer, opponentPlayer);

    return (
        <Flex bgColor="gray.400" w="100%" h="200px" p="15px" rounded={8} pos="relative">
            {<CloseButton pos="absolute" bottom="100%" left="100%" bgColor="gray.100" onClick={deleteGame} />}
            <PlayerSlot>
                <PlayerSlotContent player={hostPlayer} />
            </PlayerSlot>
            <Center w="80px" flexShrink={0}>
                <VsCircle />
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

const VsCircle = () => (
    <Circle size={"40px"} bgColor="gray.300">
        <chakra.span textTransform="uppercase" color="gray.900" fontSize="small">
            VS
        </chakra.span>
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
