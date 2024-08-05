// Controllers
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const getStatus = async (req, res) => {
  try {
    const redisAlive = await redisClient.isAlive();
    const dbAlive = await dbClient.isAlive();
    res.status(200).send({ redis: redisAlive, db: dbAlive });
  } catch (error) {
    res.status(500).send({ error: 'Error checking status' });
  }
};

const getStats = async (req, res) => {
  try {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();
    res.status(200).send({ users, files });
  } catch (error) {
    res.status(500).send({ error: 'Error fetching statistics' });
  }
};

module.exports = {
  getStatus,
  getStats,
};
