import { appYDocAtom, useAppYDoc } from "@/store";
import { AwarenessState, Game } from "@/types";
import { makeGame, makePlayer, removeItemObjectMutate } from "@/utils";
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
    Flex,
    SimpleGrid,
    Stack,
} from "@chakra-ui/react";
import { useSnapshot } from "valtio";
import { useYAwareness } from "zustand-yjs";

export const RPS = () => {
    const yDoc = useAppYDoc();
    const gamesSource = useYArray<Game>(yDoc, "games");
    const games = useSnapshot(gamesSource);
    console.log(games);
    const makeNewGame = () => gamesSource.push(makeGame());

    return (
        <Stack w="100%">
            <Center flexDir="column" m="8">
                <Button onClick={makeNewGame}>New game</Button>
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

const DuelGameWidget = ({ game }) => {
    const gameSnap = useSnapshot<Game>(game);
    const [hostPlayer, opponentPlayer] = gameSnap.players || [];
    console.log(gameSnap);

    const yDoc = useYDocValue(appYDocAtom);
    const gamesSource = useYArray<Game>(yDoc, "games");
    const deleteGame = () => removeItemObjectMutate(gamesSource, "id", game.id);
    const joinGame = () => game.players.push(makePlayer());

    return (
        <Flex bgColor="gray.400" w="100%" h="200px" p="15px" rounded={8} pos="relative">
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
