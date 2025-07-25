import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal server error';

    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
    }

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};