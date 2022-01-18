import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

const sha1 = require('sha1');
const mongo = require('mongodb');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) res.status(400).json({ error: 'Missing email' });
    else if (!password) res.status(400).json({ error: 'Missing password' });
    else {
      const database = await DBClient.connection;

      const collection = database.collection('users');
      const user = await collection.findOne({ email });

      if (user !== null) res.status(400).json({ error: 'Already exist' });
      else {
        const hashedPass = sha1(password);
        collection.insertOne({ email, password: hashedPass }, (err, results) => {
          const doc = results.ops[0];
          res.status(201).json({ id: doc._id, email: doc.email });
        });
      }
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;
    const redisUser = await RedisClient.get(key);
    if (!redisUser) res.status(401).json({ error: 'Unauthorized' });
    else {
      const database = await DBClient.connection;
      const collection = database.collection('users');
      collection.findOne({ _id: new mongo.ObjectId(redisUser) }, (err, user) => {
        res.status(200).json({
          id: user._id,
          email: user.email,
        });
      });
    }
  }
}

module.exports = UsersController;
