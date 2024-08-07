// Users Controller
import sha1 from 'sha1';
import Bull from 'bull';
import dbClient from '../utils/db';

const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req, res) {
    const uEmail = req.body ? req.body.email : null;
    const uPassword = req.body ? req.body.password : null;
    if (!uEmail) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!uPassword) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const existingUser = await (await dbClient.usersCollection()).findOne({ email: uEmail });
    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = sha1(uPassword);
    const result = await (await dbClient.usersCollection())
      .insertOne({ email: uEmail, password: hashedPassword });
    const userId = result.insertedId;
    const user = await (await dbClient.usersCollection()).findOne({ _id: userId });

    // Start background processing for sending welcome email
    userQueue.add({ userId });

    res.status(201).json({ id: user._id, email: user.email });
  }

  static async getMe(req, res) {
    try {
      const { userId } = req;
      const user = await dbClient.users.findOne({ _id: userId });
      if (!user) return res.status(401).send({ error: 'Unauthorized' });
      return res.send({ id: user._id, email: user.email });
    } catch (error) {
      return res.status(500).send({ error: 'Internal server error' });
    }
  }
}

module.exports = UsersController;
