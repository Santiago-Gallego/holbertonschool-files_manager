import { env } from 'process';

const { MongoClient } = require('mongodb');

const DB_HOST = env.DB_HOST || 'localhost';
const DB_PORT = env.DB_PORT || 27017;
const DB_DATABASE = env.DB_DATABASE || 'files_manager';
const url = `mongodb://${DB_HOST}:${DB_PORT}`;

class DBClient {
  constructor() {
    this.mongoClient = new MongoClient(
      url,
      {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
    );

    const promise = new Promise((resolve, reject) => {
      this.mongoClient.connect((err) => { reject(err); });
      resolve(this.mongoClient.db(DB_DATABASE));
    });
    this.connection = promise;
  }

  isAlive() {
    return this.mongoClient.isConnected();
  }

  async nbUsers() {
    return this.connection
      .then((database) => {
        const collection = database.collection('users');
        return collection.countDocuments();
      })
      .catch();
  }

  async nbFiles() {
    return this.connection
      .then((database) => {
        const collection = database.collection('files');
        return collection.countDocuments();
      })
      .catch();
  }
}

const dbClient = new DBClient();
export default dbClient;
