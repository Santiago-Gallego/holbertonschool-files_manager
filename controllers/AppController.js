import RedisClient from '../utils/redis';
import DBClient from '../utils/db';

class AppController {
  static getStatus(req, res) {
    const data = {
      redis: RedisClient.isAlive(),
      db: DBClient.isAlive(),
    };
    res.status(200);
    res.json(data);
  }

  static async getStats(req, res) {
    const data = {
      users: await DBClient.nbUsers(),
      files: await DBClient.nbFiles(),
    };
    res.status(200);
    res.json(data);
  }
}

module.exports = AppController;
