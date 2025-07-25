import { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

export interface UserJwtPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
}

// Define the extended request interface
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
