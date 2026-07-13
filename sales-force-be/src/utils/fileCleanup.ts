import fs from 'fs/promises';
import path from 'path';

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(__dirname, '../../public', filePath);
    await fs.unlink(fullPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};

export const getFileUrl = (filePath: string | null): string | null => {
  if (!filePath) {
    return null;
  }
  return `/uploads/siteplans/${path.basename(filePath)}`;
};