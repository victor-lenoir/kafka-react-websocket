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

const listen_topic = process.env.LISTEN_TOPIC;

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
        console.log('CONNECTED USERS RIGHT NOW:', Object.keys(connected_users).length);
        var connection = request.accept('echo-protocol', request.origin);
        console.log((new Date()) + ' Connection accepted.');
        connection.on('message', function(message) {
            if (message.type === 'utf8') {
                connection.user_id = message.utf8Data;
                connected_users[connection.user_id] = connection;
            }
        });
        connection.on('close', function(reasonCode, description) {
            if (connection.user_id != null) delete connected_users[connection.user_id];
            console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        });
    });
};


async function listener() {
    redis_client.on("message", function (channel, message) {
        let parsed_message = JSON.parse(message);
        const destination = parsed_message.destination;
        console.log("REDIS WEBSOCKET RECEIVE message:", message);

        if (connected_users[destination] != null) {
            console.log('forward it to connected user');
            connected_users[destination].sendUTF(message);
        }

    });

    redis_client.subscribe(listen_topic);
    console.log('Listening to redis on topic', listen_topic);

};
listener();
main();
