import React, { useEffect } from 'react';
import config from './config';

// This is ugly but it's just for POC leave me alone
// Go through https://github.com/giantmachines/redux-websocket



function Websocket(props) {
    useEffect(() => {
        const socket = new WebSocket(config.websocket_url, "echo-protocol");
        // Connection opened
        socket.addEventListener('open', function (event) {
            console.log('Websocket connected');
            // Tell my identity to the server
        });

        // Connection opened
        socket.addEventListener('close', function (event) {
            console.log('Websocket closed');
            // We need to display a lost connection in APP and poll to retrieve connection to a new websocket =)
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            console.log('Message from server ', event.data);
        });
        // const WebsocketContext = React.createContext({websocket: });
    });
    return (<>
              {props.children}
            </>);
}

export default Websocket;
