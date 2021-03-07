const express = require('express');
const app = express();
const port = 3000;
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    clientId: 'npm-slack-notifier',
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');
const producer = kafka.producer();
var Memcached = require('memcached');
var memcached = new Memcached(process.env.MEMCACHED_HOSTS.split(','));


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
    const request_obj = {id: request_id,
                         ...req.query};
    producer.send({topic: 'request',
                   messages: [{key: 'registration', value: JSON.stringify(request_obj)}]}).then((responses) => {
                       const response = responses[0];
                       if (response.errorCode === 0) {
                           waiting_resp(req, res, request_id);
                           return;
                       }
                       else {
                           // ERROR HANDLING
                       }
                   });
}

producer.connect().then(() => {
    console.log('Kafka Producer Connected');
    app.get('/registration', async (req, res) => {
        make_request('registration', req, res);
    });

    app.get('/request/:requestId', function (req, res) {
        const request_id = req.params.requestId;
        memcached.get(req.params.requestId, function (err, data) {
            if (data == null) {
                waiting_resp(req, res, request_id);
            }
            else {
                res.send({state: 'DONE', data: JSON.parse(data)});
            }
        });
    });
    app.listen(port, () => {
        console.log(`API listening at http://localhost:${port}`);
    });
});
