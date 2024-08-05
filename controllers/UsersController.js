// Users Controller
const sha1 = require('sha1');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;
      if (!email) return res.status(400).send({ error: 'Missing email' });
      if (!password) return res.status(400).send({ error: 'Missing password' });

      const existingUser = await dbClient.users.findOne({ email });
      if (existingUser) return res.status(400).send({ error: 'Already exist' });

      const hashedPassword = sha1(password);
      const user = await dbClient.users.insertOne({ email, password: hashedPassword });
      return res.status(201).send({ id: user._id, email });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
