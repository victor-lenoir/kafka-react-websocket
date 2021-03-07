const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');
const consumer = kafka.consumer({groupId: process.env.CONSUMER_GROUP});
var Memcached = require('memcached');
var memcached = new Memcached(process.env.MEMCACHED_HOSTS.split(','));


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


            let response = {key: key};
            let status_code = 200;
            if (key === 'add_to_cart') {
                // Check Param Integrity
                // Add Stuff in database
                // Returns response
            }

            const final_stored = {status_code, response};
            // We also need to kafka produce a reply to reply_topic
            
            memcached.set(request_id, JSON.stringify(final_stored), 1800, (err) => {
                if (err == null) {
                    console.log('CALL BACK');
                }
            });
        }
    });
};
main();
