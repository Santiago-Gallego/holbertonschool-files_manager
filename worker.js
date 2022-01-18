import Queue from 'bull';
import dbClient from './utils/db';
import { ObectId } from 'mongodb';
import { imageThumbnail } from 'image-thumbnail';
import { writeFileSync } from 'fs';

const fileQueue = Queue('fileQueue');

fileQueue.process(async (job, done) => {
    if(!job.data.fileId) throw new Error('Missing fileId');
    if(!job.data.userId) throw new Error('Missing userId');

    const database = await dbClient.connection;
    const filter = {
        _id: ObectId(job.data.fileId),
        userId: ObectId(job.data.userId),
    };
    const file = await database.collection('files').findOne(filter);

    if (files.length === 0) throw new Error('File not found');

    try {
        const sizes = { 500: null, 250: null, 100: null, }
        for (const width in sizes) {
            const options = { width: width, responseType: 'base64' };
            thumbnail = await imageThumbnail(file.localPath, options);
            writeFileSync(`${file.localPath}_${width}`, thumbnail, 'base64');
        }
    } catch (error) {
        console.log(err);
    }

    done();
});
