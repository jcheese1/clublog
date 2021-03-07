import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Devtools } from "@ui-devtools/tailwind";
import { PeerContextProvider } from "./context/PeerContext";

ReactDOM.render(
  <React.StrictMode>
    <PeerContextProvider>
      <Devtools>
        <App />
      </Devtools>
    </PeerContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
