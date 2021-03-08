import React, { useEffect, useState } from 'react';
import config from './config';

// This is ugly but it's just for POC leave me alone
// Go through https://github.com/giantmachines/redux-websocket


export const WEBSOCKET_STATE = {
    INITIAL: "initial",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    CLOSE: "close"
};

function Websocket(props) {
    const [state, setState] = useState(WEBSOCKET_STATE.INITIAL);

    const try_connecting = () => {
        // If we are already connecting or connected we skip that block
        if ((state === WEBSOCKET_STATE.CONNECTING) || (state === WEBSOCKET_STATE.CONNECTED)) return;
        const socket = new WebSocket(config.websocket_url, "echo-protocol");

        // Connection opened
        socket.addEventListener('open', function (event) {
            console.log('Websocket connected');
            setState(WEBSOCKET_STATE.CONNECTED);
            // Tell my identity to the server
        });

        // Connection opened
        socket.addEventListener('close', function (event) {
            console.log('Websocket closed');
            setState(WEBSOCKET_STATE.CLOSE);
            window.setTimeout(try_connecting, 1000);  // We retry connecting in 1000ms
            
            // We need to display a lost connection in APP and poll to retrieve connection to a new websocket =)

        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            console.log('Message from server ', event.data);
        });
        // const WebsocketContext = React.createContext({websocket: });

    };
    useEffect(() => {
        try_connecting();
    }, [props]);

    let connection_banner = null;
    if (state === WEBSOCKET_STATE.CONNECTING) {
        connection_banner = <div>Reconnecting...</div>;
    }
    else if (state === WEBSOCKET_STATE.CLOSE) {
        connection_banner = <div>Lost Internet connection... Retrying...</div>;

    }
    return (<>
       {connection_banner}
       {props.children}
     </>);
}

export default Websocket;
