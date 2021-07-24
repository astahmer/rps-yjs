import fastify from "fastify";
import WebSocket from "ws";

export const makeApp = () => {
    const app = fastify({ logger: true });

    app.get("/", async (request, reply) => {
        return { hello: "world" };
    });

    return app;
};

const setupWSConnection = require("./y-websocket").setupWSConnection;
export const makeWs = (options: WebSocket.ServerOptions) => {
    console.log(setupWSConnection);
    const ws = new WebSocket.Server(options);

    ws.on("connection", (conn, req) =>
        setupWSConnection(conn, req, {
            gc: (req.url || "").slice(1) !== "prosemirror-versions",
        })
    );

    return () => ws.close();
};
