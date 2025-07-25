import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

export interface UserJwtPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// Extend Express Request globally
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
            };
        }
    }
}

export {};