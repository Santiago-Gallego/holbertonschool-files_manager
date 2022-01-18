const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.redisClient = redis.createClient().on('error', (err) => { console.log(err.message); });
  }

  isAlive() {
    return this.redisClient.connected;
  }

  async get(key) {
    const redisGet = promisify(this.redisClient.get).bind(this.redisClient);
    const value = await redisGet(key);
    return value;
  }

  async set(key, value, expDuration) {
    const redisSet = promisify(this.redisClient.setex).bind(this.redisClient);
    await redisSet(key, expDuration, value);
  }

  async del(key) {
    const redisDel = promisify(this.redisClient.del).bind(this.redisClient);
    await redisDel(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
