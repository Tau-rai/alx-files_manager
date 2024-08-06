// Users Controller
const sha1 = require('sha1');
const dbClient = require('../utils/db');

const UsersController = {
  postNew: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email) return res.status(400).send({ error: 'Missing email' });
      if (!password) return res.status(400).send({ error: 'Missing password' });

      const existingUser = await dbClient.users.findOne({ email });
      if (existingUser) return res.status(400).send({ error: 'Already exist' });

      const hashedPassword = sha1(password);
      const result = await dbClient.users.insertOne({ email, password: hashedPassword });
      const user = result.ops[0]; // For MongoDB < 4.0
      return res.status(201).send({ id: user._id, email });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  },

  getMe: async (req, res) => {
    try {
      const { userId } = req;
      const user = await dbClient.users.findOne({ _id: userId });
      if (!user) return res.status(401).send({ error: 'Unauthorized' });
      return res.send({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  },
};

module.exports = UsersController;
