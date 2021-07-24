import { makeApp, makeWs } from "./app";

const port = Number(process.env.PORT) || 1337;
const wsPort = Number(process.env.WS_PORT) || 1338;

const start = async () => {
    const app = makeApp();
    try {
        const address = await app.listen(port);
        app.log.info(`server listening on ${address}`);
        console.log({ port, wsPort });
        makeWs({ port: wsPort });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
