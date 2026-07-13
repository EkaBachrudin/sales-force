import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { Request } from 'express';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPE = 'image/svg+xml';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads/siteplans'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${randomUUID()}-${Date.now()}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype === ALLOWED_MIME_TYPE) {
    cb(null, true);
  } else {
    cb(new Error('Only SVG files are allowed'));
  }
};

export const uploadSiteplan = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const handleMulterError = (error: Error, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds maximum limit',
          details: {
            siteplan_file: [`File size must not exceed 5MB. Received: ${Math.round((error as any).limit / (1024 * 1024))}MB`],
          },
        },
      });
    }
  } else if (error.message === 'Only SVG files are allowed') {
    const mimetype = (req as any).file?.mimetype || 'unknown';
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only SVG files are allowed',
        details: {
          siteplan_file: [`File must be of type image/svg+xml. Received: ${mimetype}`],
        },
      },
    });
  }
  
  next(error);
};