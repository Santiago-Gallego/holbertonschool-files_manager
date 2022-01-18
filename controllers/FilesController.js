import DBClient from '../utils/db';
import RedisClient from '../utils/redis';
import Queue from 'bull';
import { v4 as uuid4 } from 'uuid';
import { contentType } from 'mime-types';

const mongo = require('mongodb');
const process = require('process');
const fs = require('fs');

class FilesController {
  static async postUpload (req, res) {
    const token = req.headers['x-token'];

    const mongoUserId = await RedisClient.get(`auth_${token}`);
    if (!mongoUserId) return res.status(401).json({ error: 'Unauthorized' });

    const database = await DBClient.connection;
    let collection = database.collection('users')
    const user = await collection.findOne({ _id: new mongo.ObjectID(mongoUserId) });

    const fileTypeOptions = ['folder', 'file', 'image'];
    const { name, type, data } = req.body;
    let parentId = (req.body.parentId) ? req.body.parentId : 0;
    let isPublic = (req.body.isPublic) ? req.body.isPublic : false;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !fileTypeOptions.includes(type)) return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') return res.status(400).json({ error: 'Missing data' });
    if (parentId) {
      const folder = await database.collection('files').findOne({ _id: mongo.ObjectID(parentId) });
      if (!folder) return res.status(400).json({ error: 'Parent not found' });
      if (folder.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    if (type === 'folder') {
      const query = await database.collection('files').insertOne({
        userId: new mongo.ObjectID(user._id),
        name, type, isPublic,
        parentId: (parentId) ? mongo.ObjectID(parentId) : 0,
      });
      const folder = query.ops[0];
      folder.id = folder._id;
      return res.status(201).json(folder);
    }

    let path = process.env['FOLDER_PATH'] || '/tmp/files_manager';
    // if (parentId !== 0) path = `${path}/${parentId}`;
    const file = {
      userId: user._id,
      name, type, isPublic, parentId,
      localPath: `${path}/${uuid4()}`,
    };

    database.collection('files').insertOne(file, (err, result) => {
      if (err) return;
      const file = result.ops[0];
      file.id = file._id;

      const callback = (err) => {
        if (err) return res.status(500).send(`oh no\n${err.message}`);
        return res.status(201).json(file);
      };

      fs.mkdir(path, async () => {
        if (file.type === 'image') {
          const queue = new Queue('fileQueue');
          await queue.add({ userId: file.userId, fileId: file.id});
          fs.writeFile(file.localPath, Buffer.from(data, 'base64').toString('binary'), callback);
        } else {
          fs.writeFile(file.localPath, Buffer.from(data, 'base64').toString('utf-8'), callback);
        }
      });
    });
  }

  static async getShow (req, res) {
    const fileId = req.params.id;
    const token = req.headers['x-token'];

    if (!token || !fileId) res.status(401).json({ error:'Unauthorized' });
    else {
      const database = await DBClient.connection;
      const userColl = database.collection('users');
      const fileColl = database.collection('files');

      const mongoUserId = await RedisClient.get(`auth_${token}`);
      const user = await userColl.findOne({ _id: new mongo.ObjectId(mongoUserId) });
      console.log(user);
      if (user) {
        const filterQuery = { _id: new mongo.ObjectId(fileId), userId: user._id };
        const file = await fileColl.findOne(filterQuery);

        if (!file) return res.status(404).json({ error:'Not found' });

        res.status(200).json(file);
      } else {
        return res.status(401).json({ error:'Unauthorized' });
      }
    }
  }

  static async getIndex (req, res) {
    const token = req.headers['x-token'];
    const parentId = req.query.parentId || '0';
    const page = req.query.page || 0;

    const database = await DBClient.connection;
    const userColl = database.collection('users');
    const fileColl = database.collection('files');

    const mongoUserId = await RedisClient.get(`auth_${token}`);
    const user = await userColl.findOne({ _id: new mongo.ObjectId(mongoUserId) });

    if (!user) res.status(401).json({ error:'Unauthorized' });
    else {
      const docsPerPage = 20;
      const filterQuery = [ 
                            { '$match': { parentId, userId: user._id } },
                            { '$project': { "id": "$_id", 'userId': "$userId", 'name': 1, 'type': 1, 'parentId': 1 } },
                            { '$limit': docsPerPage },
                            { '$skip': page * docsPerPage },
                          ]

      const fileDocs = await fileColl.aggregate(filterQuery).toArray();

      res.status(200).json(fileDocs);
    }
  }

  static async putPublish (req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const database = await DBClient.connection;
    const userColl = database.collection('users');
    const fileColl = database.collection('files');

    const mongoUserId = await RedisClient.get(`auth_${token}`);
    const user = await userColl.findOne({ _id: new mongo.ObjectId(mongoUserId) });

    if (!user) res.status(401).json({ error:'Unauthorized' });
    else {
      const filterQuery = { _id: new mongo.ObjectId(fileId), userId: user._id };
      const file = await fileColl.findOne(filterQuery);

      if (!file) res.status(404).json({ error:'Not found' });
      await fileColl.updateOne(filterQuery, { '$set': { 'isPublic':  true } })

      const updatedDoc = await fileColl.findOne(filterQuery);
      res.status(200).json(updatedDoc);
    }
  }

  static async putUnpublish (req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const database = await DBClient.connection;
    const userColl = database.collection('users');
    const fileColl = database.collection('files');

    const mongoUserId = await RedisClient.get(`auth_${token}`);
    const user = await userColl.findOne({ _id: new mongo.ObjectId(mongoUserId) });

    if (!user) res.status(401).json({ error:'Unauthorized' });
    else {
      const filterQuery = { _id: new mongo.ObjectId(fileId), userId: user._id };
      const file = await fileColl.findOne(filterQuery);

      if (!file) res.status(404).json({ error:'Not found' });
      await fileColl.updateOne(filterQuery, { '$set': { 'isPublic':  false } })

      const updatedDoc = await fileColl.findOne(filterQuery);
      res.status(200).json(updatedDoc);
    }
  }

  static async getFile (req, res) {
    const token = req.headers['x-token'];
    const fileId = req.params.id;

    const database = await DBClient.connection;
    const userColl = database.collection('users');
    const fileColl = database.collection('files');

    const mongoUserId = await RedisClient.get(`auth_${token}`);
    const user = await userColl.findOne({ _id: new mongo.ObjectId(mongoUserId) });

    if (!token) return res.status(404).json({ error:'Not found' });
    if (!user) res.status(401).json({ error:'Unauthorized' });
    else {
      const filterQuery = { _id: new mongo.ObjectId(fileId) };
      const file = await fileColl.findOne(filterQuery);

      if (!file) return res.status(404).json({ error:'Not found' });
      if (!file.isPublic && file.userId.toString() !== user._id.toString()) return res.status(404).json({ error:'Not found' });
      else if (file.type === 'folder') res.status(400).json({error: "A folder doesn't have content"});
      // If the file is not locally present, return an error Not found with a status code 404
      else {
        const mimeType = contentType(file.name) || 'text/plain';
        const filePath = file.localPath;

        fs.readFile(filePath, 'utf-8', (err, fileContent) => {
          if (err) res.status(400).json({ error: 'Unable to read contents of the file'});
          else {
            res.header('Content-Type', mimeType);
            res.status(200).send(fileContent);
          }
        });

      }
    }
  }

}

module.exports = FilesController;
