import React from "react";
import { usePeer } from "./context/PeerContext";

function App() {
  const state = usePeer();
  const [form, update] = React.useState({
    username: "",
    hostId: "",
  });

  const handleCreateRoom = () => {
    state.dispatch({
      type: "CREATE_ROOM",
      payload: { username: form.username },
    });
  };

  const handleJoinRoom = () => {
    state.dispatch({
      type: "JOIN_ROOM",
      payload: { username: form.username, hostId: form.hostId },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md m-auto w-full">
        <div className="py-12 px-12 shadow-sm rounded-md bg-white">
          {state.transform({
            IDLE: () => (
              <div className="space-y-4 flex flex-col">
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={(e) =>
                    update({ ...form, username: e.currentTarget.value })
                  }
                  className="border-gray-300 placeholder-gray-500 px-3 py-2 border text-gray-900 rounded-md focus:outline-none focus:border-blue-300 text-sm md:text-base"
                  placeholder="Username"
                />

                <button
                  onClick={handleCreateRoom}
                  className="items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Create Room
                </button>
                <div className="inline-flex items-center space-x-4">
                  <hr className="w-full" />
                  <p className="text-gray-400">Or</p>
                  <hr className="w-full" />
                </div>
                <input
                  type="text"
                  name="id"
                  value={form.hostId}
                  onChange={(e) =>
                    update({ ...form, hostId: e.currentTarget.value })
                  }
                  className="border-gray-300 placeholder-gray-500 px-3 py-2 border text-gray-900 rounded-md focus:outline-none focus:border-blue-300 text-sm md:text-base"
                  placeholder="Room ID"
                />
                <button
                  onClick={handleJoinRoom}
                  className="items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Join Room
                </button>
              </div>
            ),
            INITIALIZING: () => "Loading...",
            INITIALIZED: (data) => {
              const { peer, peerList, ...rest } = data;
              console.log(peerList);
              return (
                <div>
                  <pre>{JSON.stringify({ ...rest, id: peer.id }, null, 2)}</pre>
                </div>
              );
            },
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
