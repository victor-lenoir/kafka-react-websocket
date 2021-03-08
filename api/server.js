const express = require('express');
const app = express();
const port = 8080;
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');
const producer = kafka.producer();

const redis_host = process.env.REDIS_HOSTS.split(',')[0];
const redis_url = '//' + redis_host;
const redis = require("redis");
const redis_client = redis.createClient(redis_url);

const microservice_topic = process.env.SHOP_TOPIC;

function waiting_resp(req, res, request_id) {
    const poll_url = req.protocol + '://' + req.get('host') + '/request/' + request_id;
    res.send({state: 'PENDING',
              poll_url: poll_url,
              min_wait: 0.1 + 0.001,
              every: 0.2,
              timeout: 5});

}

function make_request(name, req, res) {
    // if NONCE we do something else maybe ?
    const request_id = uuidv4();
    // the reply_topic is actually the websocket channel and is given by the websocket ITSELF by the client !!!! YEAAAAA
    let headers = {request_id: request_id, reply_topic: reply_topic};

    if (req.query.websocket_channel != null) {
        headers['websocket_channel'] = req.query.websocket_channel;
        headers['websocket_connection_id'] = req.query.websocket_connection_id;

        // https://hackernoon.com/scaling-websockets-9a31497af051
    }
    const request_obj = {...req.query};
    producer.send({topic: microservice_topic,
                   messages: [{key: name, headers: headers, value: JSON.stringify(request_obj)}]}).then((responses) => {
                       const response = responses[0];
                       if (response.errorCode === 0) {
                           waiting_resp(req, res, request_id);
                           return;
                       }
                       else {
                           res.send({state: 'ERROR',
                                     error: 'kafka_message_failed'});
                       }
                   });
}

producer.connect().then(() => {
    console.log('Kafka Producer Connected');
    app.get('/add_to_cart', async (req, res) => {
        make_request('add_to_cart', req, res);
    });

    app.get('/request/:requestId', function (req, res) {
        const request_id = req.params.requestId;
        redis_client.get(req.params.requestId, function (err, data) {
            if (data == null) {
                waiting_resp(req, res, request_id);
            }
            else {
                res.send({state: 'DONE', data: JSON.parse(data.toString())});
            }
        });
    });
    app.listen(port, () => {
        console.log(`API listening at http://localhost:${port}`);
    });
});
