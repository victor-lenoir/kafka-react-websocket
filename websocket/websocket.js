const { Kafka } = require('kafkajs');
const kafka = new Kafka({
    brokers: process.env.KAFKA_BROKER_HOSTS.split(',')
});
const { v4: uuidv4 } = require('uuid');

const redis_host = process.env.REDIS_HOSTS.split(',')[0];
const redis_url = '//' + redis_host;
const redis = require("redis");
const redis_client = redis.createClient(redis_url);


async function main() {
    console.log('Websocket run');
    
};
main();
