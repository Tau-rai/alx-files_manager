// worker.js
import Bull from 'bull';

const path = require('path');
const fs = require('fs');
const thumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.getFileById(fileId);

  if (!file || file.userId !== userId) {
    throw new Error('File not found');
  }

  if (file.type !== 'image') {
    throw new Error('File is not an image');
  }

  const filePath = file.localPath;
  const sizes = [500, 250, 100];

  try {
    const thumbnailPromises = sizes.map(async (size) => {
      const thumbnailPath = path.join(
        path.dirname(filePath),
        `${path.basename(filePath, path.extname(filePath))}_${size}${path.extname(filePath)}`,
      );

      const imageBuffer = fs.readFileSync(filePath);
      const options = { width: size };
      const thumbnailBuffer = await thumbnail(imageBuffer, options);

      fs.writeFileSync(thumbnailPath, thumbnailBuffer);
    });

    await Promise.all(thumbnailPromises);

    console.log(`Thumbnails created for file ${fileId}`);
  } catch (error) {
    console.error(`Failed to process file ${fileId}:`, error);
  }
});

console.log('Thumbnail worker started');
