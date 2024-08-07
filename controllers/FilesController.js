// filesController.js
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import fileQueue from '../utils/fileQueue';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

// Ensure the folder exists
if (!fs.existsSync(FOLDER_PATH)) {
  fs.mkdirSync(FOLDER_PATH, { recursive: true });
}

const FilesController = {
  postUpload: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userId = await redisClient.get(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name, type, parentId = 0, isPublic = false, data,
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      if (parentId !== 0) {
        const parentFile = await dbClient.getFileById(parentId);
        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      let result;
      if (type === 'folder') {
        const newFile = {
          userId,
          name,
          type,
          isPublic,
          parentId,
        };

        result = await dbClient.createFile(newFile);
      } else {
        const fileExtension = path.extname(name);
        const mimeType = mime.lookup(name) || 'application/octet-stream';
        const filePath = path.join(FOLDER_PATH, `${uuid.v4()}${fileExtension}`);
        const fileBuffer = Buffer.from(data, 'base64');

        fs.writeFileSync(filePath, fileBuffer);

        const newFile = {
          userId,
          name,
          type,
          isPublic,
          parentId,
          localPath: filePath,
          mimeType,
        };

        result = await dbClient.createFile(newFile);

        // Add job to the queue if the file type is image
        if (type === 'image') {
          await fileQueue.add({
            userId,
            fileId: result._id,
          });
        }
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getShow: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from token
      const userId = await redisClient.get(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const file = await dbClient.getFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.userId !== userId && !file.isPublic) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return res.status(200).json(file);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getIndex: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from token
      const userId = await redisClient.get(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const parentId = req.query.parentId || 0;
      const page = req.query.page || 0;
      const pageSize = 20;

      const files = await dbClient.getFilesByParentIdWithPagination(parentId, page, pageSize);

      const filteredFiles = files.filter((file) => file.userId === userId || file.isPublic);

      return res.status(200).json(filteredFiles);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  putPublish: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from token
      const userId = await redisClient.get(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const file = await dbClient.getFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedFile = await dbClient.updateFileById(id, { isPublic: true });

      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  putUnpublish: async (req, res) => {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve user from token
      const userId = await redisClient.get(token);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { id } = req.params;
      const file = await dbClient.getFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updatedFile = await dbClient.updateFileById(id, { isPublic: false });

      return res.status(200).json(updatedFile);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  getFile: async (req, res) => {
    try {
      const { id } = req.params;
      const size = parseInt(req.query.size, 10);

      if (![500, 250, 100].includes((size))) {
        return res.status(400).json({ error: 'Invalid size' });
      }

      const file = await dbClient.getFileById(id);

      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      if (file.type !== 'image') {
        return res.status(400).json({ error: 'Not an image file' });
      }

      const filePath = file.localPath;
      const thumbnailPath = path.join(
        path.dirname(filePath),
        `${path.basename(filePath, path.extname(filePath))}_${size}${path.extname(filePath)}`,
      );

      if (!fs.existsSync(thumbnailPath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.sendFile(thumbnailPath);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = FilesController;
