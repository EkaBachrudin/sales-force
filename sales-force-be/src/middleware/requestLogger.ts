import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;

    if (statusCode >= 400) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
};
