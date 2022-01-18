import redisClient from "../utils/redis";

const assert = require('assert');
const client = redisClient;

describe('Redis util', () => {
    it('Connected', () => {
        assert.equal(true, client.isAlive());
    });

    it('get', async() => {
        await client.set('key', 'value', 5);
        let value;
        try {
            value = await client.get('key');
        } catch (error) {
            value = undefined;
            console.log(error.message);
        }
        assert.equal(value, 'value');
    });

    it('set', async() => {
        await client.set('key', 'value2', 5)
        let value;
        try {
            value = await client.get('key');
        } catch (error) {
            value = undefined;
            console.log(error.message);
        }
        assert.equal(value, 'value2');
    });

    it('del', async () => {
        await client.del('key');
        let value;
        try {
            value = await client.get('key');
        } catch (error) {
            value = 1;
            console.log(error.message);
        }
        assert.equal(value, undefined);
    });
});

