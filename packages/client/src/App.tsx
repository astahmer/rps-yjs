import { Center, ChakraProvider, extendTheme, Flex } from "@chakra-ui/react";
import "./App.css";
import { RPS } from "./pages/RPS";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import { Test } from "./pages/Test";

const theme = extendTheme({ config: { initialColorMode: "light" } });

function App() {
    return (
        <ChakraProvider theme={theme}>
            <BrowserRouter>
                <Flex direction="column" boxSize="100%">
                    <Center my={["20px", "40px"]} px={[0, "4"]} maxW="1200px" alignSelf="center">
                        {/* <RPS /> */}
                    </Center>
                    <Center p={[0, "8"]} pt="0" h="100%">
                        <Switch>
                            <Route path="/test" children={<Test />} />
                            <Route path="/" children={<RPS />} />
                        </Switch>
                    </Center>
                </Flex>
            </BrowserRouter>
        </ChakraProvider>
    );
}

export default App;
