import dbClient from '../utils/db';

const request = require('request');
const { promisify } = require('util');
const process = require('process');
const assert = require('assert');

const PORT = process.env['PORT'] || '5000';
const HOST = '0.0.0.0';
const url = `${HOST}:${PORT}`;

describe('API Endpoints', () => {
    describe('POST /users', () => {
        const promRequest = promisify(request);
        const options = {
            method: 'POST',
            uri: `http://${url}/users`,
            json: {
                'email': 'bob@dylan.com',
                'password': 'toto1234!', 
            }
        };
        const myRequest = promRequest(options);

        it('postNew', async () => {
            const response = await myRequest
            assert.equal(response.statusCode, 201);
        });
    });

});
