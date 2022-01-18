const request = require('request');
const { promisify } = require('util');
const process = require('process');
const assert = require('assert');

const PORT = process.env['PORT'] || '5000';
const HOST = '0.0.0.0';
const url = `${HOST}:${PORT}`;

describe('API Endpoints', () => {
    describe('GET /status', () => {
        const promRequest = promisify(request);
        const myRequest = promRequest(`http://${url}/status`);

        it('Correct url', () => {
            assert.equal(url, `${HOST}:${PORT}`);
        });
        
        it('No error', async () => {
            await myRequest
            .then()
            .catch( (err) => { assert.equal(err, null); });
        });

        it('Good status', async () => {
            await myRequest
            .then(
                (res) => {
                    assert.equal(res.statusCode, 200);
            })
            .catch();
        });

        it('Correct response', async () => {
            await myRequest
            .then(
                (res) => {
                    try {
                        assert.equal(res.body, '{"redis":true,"db":true}');
                    } catch (error) {
                        throw(new Error('Wrong response'));
                    }
            })
            .catch();
        });
    });

    describe('GET /stats', () => {
        const promRequest = promisify(request);
        const myRequest = promRequest(`http://${url}/stats`);

        it('Correct url', () => {
            assert.equal(url, `${HOST}:${PORT}`);
        });
        
        it('No error', async () => {
            await myRequest
            .then()
            .catch( (err) => { assert.equal(err, null); });
        });

        it('Good status', async () => {
            await myRequest
            .then(
                (res) => {
                    assert.equal(res.statusCode, 200);
            })
            .catch();
        });

        it('Correct response', async () => {
            await myRequest
            .then(
                (res) => {
                    try {
                        const data = JSON.parse(res.body);
                        assert.equal(true, typeof data.users === 'number');
                        assert.equal(true, typeof data.files === 'number');
                    } catch (error) {
                        throw(new Error('Wrong response'));
                    }
            })
            .catch();
        });
    });
});
