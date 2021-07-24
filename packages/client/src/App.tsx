import { Center, ChakraProvider, extendTheme, Flex } from "@chakra-ui/react";
import "./App.css";
import { Example } from "./Example";
import { RPS } from "./RPS";

const theme = extendTheme({ config: { initialColorMode: "light" } });

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Flex direction="column" boxSize="100%">
        <Center
          my={["20px", "40px"]}
          px={[0, "4"]}
          maxW="1200px"
          alignSelf="center"
        >
          {/* <RPS /> */}
        </Center>
        <Center p={[0, "8"]} pt="0" h="100%">
          <Example />
        </Center>
      </Flex>
    </ChakraProvider>
  );
}

export default App;
