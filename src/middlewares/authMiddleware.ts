import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../../types';

const JWT_SECRET = process.env.JWT_SECRET;

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {

    const authHeader = req.get('Authorization');

    if (!authHeader) {
        console.log('No authorization header found');
        return res.status(401).json({ message: 'Token not provided' });
    }

    const [bearer, token] = authHeader.split(' ');

    if (!token) {
        console.log('Token is missing after split');
        return res.status(401).json({ message: 'Token format invalid' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as { id: string; email: string; role: string };

        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        console.error('Error type:', error instanceof jwt.JsonWebTokenError ? 'JsonWebTokenError' : typeof error);
        if (error instanceof jwt.JsonWebTokenError) {
            console.error('JWT Error message:', error.message);
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};