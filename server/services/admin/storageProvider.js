const fs = require('fs');
const path = require('path');

// Base storage directory at root of server project: storage/uploads/
const STORAGE_ROOT = process.env.STORAGE_PATH
  ? path.resolve(process.env.STORAGE_PATH)
  : path.join(__dirname, '..', '..', 'storage', 'uploads');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

class LocalDiskStorageDriver {
  constructor(baseDir = STORAGE_ROOT) {
    this.baseDir = baseDir;
    ensureDirectoryExists(this.baseDir);
  }

  async saveFile({ subfolder, filename, buffer }) {
    const targetDir = subfolder ? path.join(this.baseDir, subfolder) : this.baseDir;
    ensureDirectoryExists(targetDir);

    const filePath = path.join(targetDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    const relativePath = subfolder ? `${subfolder}/${filename}` : filename;
    const publicUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    return {
      filePath,
      publicUrl,
    };
  }

  async deleteFile(publicUrl) {
    if (!publicUrl || !publicUrl.startsWith('/uploads/')) return false;
    const relativePath = publicUrl.replace('/uploads/', '');
    const fullPath = path.join(this.baseDir, relativePath);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      return true;
    }
    return false;
  }
}

// Current driver instance (Local disk by default, extensible to S3/Cloudinary)
const storageDriver = new LocalDiskStorageDriver();

module.exports = {
  STORAGE_ROOT,
  storageDriver,
  LocalDiskStorageDriver,
};
