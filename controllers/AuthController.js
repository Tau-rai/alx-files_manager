// controllers/AuthController.js
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const AuthController = {
  getConnect: async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.replace('Basic ', '');
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const user = await dbClient.getUserByEmailAndPassword(email, hashedPassword);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = uuidv4();
      const redisKey = `auth_${token}`;
      await redisClient.set(redisKey, user.id, 'EX', 24 * 60 * 60); // Set token in Redis for 24 hours

      return res.status(200).json({ token }); // Added return
    } catch (err) {
      console.error('Error in getConnect:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Added return
    }
  },

  getDisconnect: async (req, res) => {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const redisKey = `auth_${token}`;
      const userId = await redisClient.get(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await redisClient.del(redisKey);
      return res.status(204).send(); // Added return
    } catch (err) {
      console.error('Error in getDisconnect:', err);
      return res.status(500).json({ error: 'Internal Server Error' }); // Added return
    }
  },
};

module.exports = AuthController;
