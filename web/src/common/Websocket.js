import React, { useEffect, useState, useContext } from 'react';
import process_server_messages from './process_server_messages';
import config from './config';

// This is ugly but it's just for POC leave me alone
// Go through https://github.com/giantmachines/redux-websocket


export const WEBSOCKET_STATE = {
    INITIAL: "initial",
    CONNECTING: "connecting",
    CONNECTED: "connected",
    CLOSE: "close"
};


const WebsocketContext = React.createContext({});

function Websocket(props) {
    const [state, setState] = useState(WEBSOCKET_STATE.INITIAL);
    const [websocketChannel, setWebsocketChannel] = useState(null);
    const [connectionId, setConnectionId] = useState(null);

    function reinit() {
        setState(WEBSOCKET_STATE.INITIAL);
    }
    useEffect(() => {
        // If we are already connecting or connected we skip that block
        if (state !== WEBSOCKET_STATE.INITIAL) return;
        setState(WEBSOCKET_STATE.CONNECTING);
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
            setWebsocketChannel(null);
            setConnectionId(null);
            window.setTimeout(reinit, 2000);  // We retry connecting in 1000ms
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            const data_obj = JSON.parse(event.data);
            if (data_obj.connection_id != null) {
                setConnectionId(data_obj.connection_id);
            }
            if (data_obj.websocket_channel != null) {
                setWebsocketChannel(data_obj.websocket_channel);
            }
            else {
                process_server_messages(data_obj);
            }
        });
    }, [state]);
    let connection_banner = null;
    if (state === WEBSOCKET_STATE.CONNECTING) {
        connection_banner = <div>Reconnecting...</div>;
    }
    else if (state === WEBSOCKET_STATE.CLOSE) {
        connection_banner = <div>Lost Internet connection... Retrying...</div>;

    }
    return (<WebsocketContext.Provider value={{websocket_channel:websocketChannel, connection_id: connectionId, websocket_state : state}}>
              {connection_banner}
              {props.children}
            </WebsocketContext.Provider>);
}

export function useWebsocket() {
    return useContext(WebsocketContext);
}

export default Websocket;
