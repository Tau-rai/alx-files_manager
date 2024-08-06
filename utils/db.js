const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null;

    this.connect()
      .then(() => {
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
      });
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(database);
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      throw err;
    }
  }

  isAlive() {
    return this.db !== null && this.client.isConnected();
  }

  async nbUsers() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection('users').countDocuments();
  }

  async nbFiles() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection('files').countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
