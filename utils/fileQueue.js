// utils/fileQueue.js

const Bull = require('bull');
const redisConfig = { host: 'localhost', port: 6379 }; 

const fileQueue = new Bull('fileQueue', { redis: redisConfig });

module.exports = fileQueue;
