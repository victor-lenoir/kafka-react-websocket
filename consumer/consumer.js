const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');
const consumer = kafka.consumer({groupId: process.env.CONSUMER_GROUP});

const redis_host = process.env.REDIS_HOSTS.split(',')[0];
const redis_url = '//' + redis_host;
const redis = require("redis");
const redis_client = redis.createClient(redis_url);


async function main() {
    await consumer.connect();
    await consumer.subscribe({ topic: process.env.SHOP_TOPIC, fromBeginning: true });
    await consumer.run({
        partitionsConsumedConcurrently: 3,
        eachMessage: async ({ topic, partition, message }) => {
            const key = message.key.toString();
            const headers = message.headers;
            const timestamp = message.timestamp;
            const value = JSON.parse(message.value.toString());
            const request_id = headers['request_id'].toString();
            const reply_topic = headers['reply_topic'].toString();
            let user_id = value.user_id;

            let response = {key: key};
            let status_code = 200;
            if (key === 'add_to_cart') {
                // Check Param Integrity
                // Add Stuff in database
                // Returns response
            }
            console.log('Consume.');
            let final_stored = {status_code, response};
            const final_value = JSON.stringify(final_stored);
            // We set the final request_id => response to redis that can be polled VIA the API
            redis_client.set(request_id, final_value, 'EX', 1800, (err) => {
                if (err == null) {
                }
            });
            if (user_id != null) {
                final_stored['destination'] = user_id;
                
                // We also publish a message for the websockets
                redis_client.publish(reply_topic, JSON.stringify(final_stored), (err) => {
                    if (err == null) {
                    }
                });
            }

        }
    });
};
main();
