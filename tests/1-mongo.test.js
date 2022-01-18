import dbClient  from "../utils/db";

const assert = require('assert');


describe('MongoDB', () =>{

    it('isAlive', async () => {
        assert.equal(true, dbClient.isAlive());
    });

    it('nbUsers', async () => {
        assert.equal(true, 0 <= await dbClient.nbUsers());
    });
    it('bnFiles', async () => {
        assert.equal(true, 0 <= await dbClient.nbFiles());
    });

});