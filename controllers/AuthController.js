import { v4 as uuid4 } from 'uuid';
import DBClient from '../utils/db';
import RedisClient from '../utils/redis';

const sha1 = require('sha1');

class AuthController {
  static async getConnect(req, res) {
    const [authType, b64UserPass] = req.headers.authorization.split(' ');

    if (authType !== 'Basic') res.status(500).json({ error: 'Invalid auth type' });
    else {
      const decode = (base64Str) => {
        const buff = Buffer.from(base64Str, 'base64');
        return buff.toString('utf-8');
      };

      const [email, password] = decode(b64UserPass).split(':', 2);
      const database = await DBClient.connection;
      const user = await database.collection('users').findOne({
        email,
        password: sha1(password),
      });

      if (!user) res.status(401).json({ error: 'Unauthorized' });
      else {
        const token = uuid4();
        const key = `auth_${token}`;

        await RedisClient.set(key, user._id.toString(), 24 * 60 * 60);
        res.status(200).json({ token });
      }
    }
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const key = `auth_${token}`;

    const user = await RedisClient.get(key);
    if (!user) res.status(401).json({ error: 'Unauthorized' });
    else {
      await RedisClient.del(key);
      res.status(204).send();
    }
  }
}
module.exports = AuthController;
