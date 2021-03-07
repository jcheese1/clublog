import React from "react";
import { States, useStates } from "react-states";
import Peer from "peerjs";
import uuid from "uuid-random";

type PeerContext =
  | {
      state: "IDLE";
    }
  | {
      state: "INITIALIZED";
      stream: MediaStream;
      peer: Peer;
      username: string;
      hostId?: string;
      type: "join" | "create";
      peerList: Map<string, Peer.DataConnection>;
    }
  | {
      state: "INITIALIZING";
      peer: Peer;
      username: string;
      hostId?: string;
      type: "join" | "create";
    };

type PeerActions =
  | {
      type: "JOIN_ROOM";
      payload: {
        hostId: string;
        username: string;
      };
    }
  | {
      type: "CREATE_ROOM";
      payload: {
        username: string;
      };
    }
  | { type: "LEAVE_ROOM" }
  | { type: "INITIALIZE_SUCCESS"; stream: MediaStream }
  | { type: "CONNECTION_ERROR"; error: any }
  | { type: "ADD_LISTENER"; peer: Peer.DataConnection }
  | { type: "REMOVE_LISTENER"; peerId: string };

const PeerContext = React.createContext<null | States<
  PeerContext,
  PeerActions
>>(null);

function createPeer(id: string) {
  return new Peer(id, {
    debug: 2,
  });
}

const PeerContextProvider = ({ children }: { children: React.ReactNode }) => {
  const peerState = useStates<PeerContext, PeerActions>(
    {
      IDLE: {
        JOIN_ROOM: ({ payload: { username, hostId } }) => {
          const peer = createPeer(uuid());
          return {
            state: "INITIALIZING",
            peer,
            username,
            hostId,
            type: "join",
          };
        },
        CREATE_ROOM: ({ payload: { username } }) => {
          const peer = createPeer(uuid());
          return { state: "INITIALIZING", peer, username, type: "create" };
        },
      },
      INITIALIZED: {
        LEAVE_ROOM: () => ({ state: "IDLE" }),
        CONNECTION_ERROR: ({ error }) => ({ state: "IDLE", error }),
        ADD_LISTENER: ({ peer }, data) => ({
          ...data,
          state: "INITIALIZED",
          peerList: data.peerList.set(peer.metadata.id, peer),
        }),
        REMOVE_LISTENER: ({ peerId }, data) => {
          data.peerList.delete(peerId);
          return {
            ...data,
            state: "INITIALIZED",
            peerList: data.peerList,
          };
        },
      },
      INITIALIZING: {
        INITIALIZE_SUCCESS: ({ stream }, data) => ({
          ...data,
          stream,
          state: "INITIALIZED",
          peerList: new Map(),
        }),
      },
    },
    {
      state: "IDLE",
    }
  );

  const { dispatch, exec } = peerState;

  React.useEffect(
    () =>
      exec({
        INITIALIZING: (ctx) => {
          const peer = ctx.peer;

          navigator.mediaDevices
            .getUserMedia({
              audio: true,
            })
            .then((stream) => {
              peer.on("open", () => {
                console.log("peerConnection::OPEN");

                if (ctx.type === "join" && ctx.hostId) {
                  const conn = peer.connect(ctx.hostId, {
                    metadata: {
                      username: ctx.username,
                      id: peer.id,
                    },
                  });

                  conn.on("open", () => {
                    console.log("success");
                    conn.send("hello, host");
                  });

                  conn.on("data", (d) => {
                    console.log("usePeer::listener data recieved", d);
                  });
                }

                dispatch({ type: "INITIALIZE_SUCCESS", stream });
              });

              peer.on("error", (error) => {
                dispatch({ type: "CONNECTION_ERROR", error });
                console.log("usePeer::Peer error", error);
                peer.disconnect();
                peer.destroy();
              });
            });
        },
        INITIALIZED: (ctx) => {
          const peer = ctx.peer;

          if (ctx.type === "create") {
            peer.on("connection", (conn) => {
              console.log(`PeerContext::Incoming peer connection ${conn}`);

              conn.on("data", (data) => {
                console.log(
                  `PeerContext::Incoming peer data ${conn.peer}`,
                  data
                );
              });

              conn.on("close", () => {
                console.log(`PeerContext::Closed peer connection ${conn.peer}`);
                dispatch({ type: "REMOVE_LISTENER", peerId: conn.peer });
              });

              conn.on("open", () => {
                dispatch({ type: "ADD_LISTENER", peer: conn });
                peer.call(conn.peer, ctx.stream);
                conn.send({
                  action: "ping",
                });
              });
            });
          }

          peer.on("call", (call) => {
            call.on("stream", (stream) => {
              console.log(stream);
              const audioObj = new Audio();
              audioObj.srcObject = stream;
              audioObj.play();
            });

            call.answer();
          });
        },
      }),
    [exec]
  );

  return (
    <PeerContext.Provider value={peerState}>{children}</PeerContext.Provider>
  );
};

const usePeer = () => {
  const context = React.useContext(PeerContext);

  if (!context) {
    throw Error("No context");
  }

  return context;
};

export { usePeer, PeerContextProvider };
