const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');

const http = require('http');

const redis_host = process.env.REDIS_HOSTS.split(',')[0];
const redis_url = '//' + redis_host;
const redis = require("redis");
const redis_client = redis.createClient(redis_url);

// The listening redis channel is created at launch
// Forwarded to new client, to the api pod, stored in the kafka header, then when consumed is used to forward the reply the websocket server and back to the client... Simple really
const listen_channel = uuidv4();

const WebSocketServer = require('websocket').server;

let connected_users = {};

async function main() {
    console.log('Websocket run');
    var server = http.createServer(function(request, response) {
        console.log((new Date()) + ' Received request for ' + request.url);
        response.writeHead(404);
        response.end();
    });

    server.listen(3001, function() {
        console.log((new Date()) + ' Websocket Server is listening on port 3001');
    });
    let wsServer = new WebSocketServer({
        httpServer: server,
        // You should not use autoAcceptConnections for production
        // applications, as it defeats all standard cross-origin protection
        // facilities built into the protocol and the browser.  You should
        // *always* verify the connection's origin and decide whether or not
        // to accept it.
        autoAcceptConnections: false
    });

    function originIsAllowed(origin) {
        // put logic here to detect whether the specified origin is allowed.
        return true;
    }

    wsServer.on('request', function(request) {
        if (!originIsAllowed(request.origin)) {
            // Make sure we only accept requests from an allowed origin
            request.reject();
            console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
            return;
        }
        var connection = request.accept('echo-protocol', request.origin);
        connection.id = uuidv4();
        connected_users[connection.id] = connection;
        console.log('CONNECTED USERS RIGHT NOW:', Object.keys(connected_users).length, Object.keys(connected_users));

        function whoami() {
            connection.sendUTF(JSON.stringify({connection_id: connection.id,
                                               websocket_channel: listen_channel}));
        }
        whoami();
        console.log((new Date()) + ' Connection accepted.');
        connection.on('message', function(message) {
            if ((message.type === 'utf8') && (message.utf8Data == 'whoami')) {
                whoami();
            }
        });
        connection.on('close', function(reasonCode, description) {
            delete connected_users[connection.id];
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });
};


async function listener() {
    redis_client.on("message", function (channel, message) {
        let parsed_message = JSON.parse(message);
        const destination = parsed_message.destination;
        console.log("REDIS WEBSOCKET RECEIVE message:", message);

        if ((connected_users[destination] != null) && (connected_users[destination].length > 0)) {
            console.log('forward it to connected user');
            connected_users[destination].map((connection) => {
                connection.sendUTF(message);
            });
        }

    });

    redis_client.subscribe(listen_channel);
    console.log('Listening to redis on channel', listen_channel);

};
listener();
main();
