// MATHEUS BALÃO

// 1. IMPORTS - What we need for testing
import { Request, Response } from 'express';
import { register, login } from '../controllers/authController';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 2. MOCKING - Replace real dependencies with fake ones
jest.mock('../models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// 3. MOCK SETUP - Create typed versions of our mocks
// Replaces the real User model with a fake one
// We don't want to hit a real database during tests - it's slow and unreliable
const mockUser = User as jest.Mocked<typeof User>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Controller', () => {  // Main test suite
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
        mockReq = {
            body: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('register', () => {    // Sub-suite for register function
        it('should register a new user successfully', async () => { // Individual test
            // 1. ARRANGE - Set up test data
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = userData;

            const mockCreatedUser = {
                _id: 'userId123',
                name: userData.name,
                email: userData.email,
                password: 'hashedPassword'
            };

            // 2. ARRANGE - Set up mock behaviors
            mockUser.findOne = jest.fn().mockResolvedValue(null);
            mockBcrypt.hash = jest.fn().mockResolvedValue('hashedPassword');
            mockUser.create = jest.fn().mockResolvedValue(mockCreatedUser);

            // 3. ACT - Call the function we're testing
            await register(mockReq as Request, mockRes as Response);

            // 4. ASSERT - Check what happened
            expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
            expect(mockBcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
            expect(mockUser.create).toHaveBeenCalledWith({
                name: userData.name,
                email: userData.email,
                password: 'hashedPassword'
            });
            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'User registered',
                user: {
                    id: 'userId123',
                    name: userData.name,
                    email: userData.email
                }
            });
        });

        it('should return error if user already exists', async () => {
            const userData = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };
            mockReq.body = userData;

            const existingUser = {
                _id: 'existingUserId',
                email: userData.email
            };

            mockUser.findOne = jest.fn().mockResolvedValue(existingUser);

            await register(mockReq as Request, mockRes as Response);

            expect(mockUser.findOne).toHaveBeenCalledWith({ email: userData.email });
            expect(mockBcrypt.hash).not.toHaveBeenCalled();
            expect(mockUser.create).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'User already exists'
            });
        });

        it('should handle database errors during registration', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = userData;

            mockUser.findOne = jest.fn().mockRejectedValue(new Error('Database connection failed'));

            await register(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                error: expect.any(Error)
            });
        });

        it('should handle bcrypt hashing errors', async () => {
            const userData = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = userData;

            mockUser.findOne = jest.fn().mockResolvedValue(null);
            mockBcrypt.hash = jest.fn().mockRejectedValue(new Error('Hashing failed'));

            await register(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                error: expect.any(Error)
            });
        });
    });

    describe('login', () => {
        it('should login user with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            const mockUserData = {
                _id: 'userId123',
                name: 'Test User',
                email: loginData.email,
                password: 'hashedPassword'
            };

            mockUser.findOne = jest.fn().mockResolvedValue(mockUserData);
            mockBcrypt.compare = jest.fn().mockResolvedValue(true);
            mockJwt.sign = jest.fn().mockReturnValue('mockToken');

            await login(mockReq as Request, mockRes as Response);

            expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUserData.password);
            expect(mockJwt.sign).toHaveBeenCalledWith(
                { id: mockUserData._id, email: mockUserData.email },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                token: 'mockToken',
                user: {
                    id: mockUserData._id,
                    name: mockUserData.name,
                    email: mockUserData.email
                }
            });
        });

        it('should return error for non-existent user', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            mockUser.findOne = jest.fn().mockResolvedValue(null);

            await login(mockReq as Request, mockRes as Response);

            expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(mockBcrypt.compare).not.toHaveBeenCalled();
            expect(mockJwt.sign).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        it('should return error for invalid password', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };
            mockReq.body = loginData;

            const mockUserData = {
                _id: 'userId123',
                name: 'Test User',
                email: loginData.email,
                password: 'hashedPassword'
            };

            mockUser.findOne = jest.fn().mockResolvedValue(mockUserData);
            mockBcrypt.compare = jest.fn().mockResolvedValue(false);

            await login(mockReq as Request, mockRes as Response);

            expect(mockUser.findOne).toHaveBeenCalledWith({ email: loginData.email });
            expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.password, mockUserData.password);
            expect(mockJwt.sign).not.toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Invalid credentials'
            });
        });

        it('should handle database errors during login', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            mockUser.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

            await login(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                error: expect.any(Error)
            });
        });

        it('should handle bcrypt comparison errors', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            const mockUserData = {
                _id: 'userId123',
                name: 'Test User',
                email: loginData.email,
                password: 'hashedPassword'
            };

            mockUser.findOne = jest.fn().mockResolvedValue(mockUserData);
            mockBcrypt.compare = jest.fn().mockRejectedValue(new Error('Comparison failed'));

            await login(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                error: expect.any(Error)
            });
        });

        it('should handle JWT signing errors', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            const mockUserData = {
                _id: 'userId123',
                name: 'Test User',
                email: loginData.email,
                password: 'hashedPassword'
            };

            mockUser.findOne = jest.fn().mockResolvedValue(mockUserData);
            mockBcrypt.compare = jest.fn().mockResolvedValue(true);
            mockJwt.sign = jest.fn().mockImplementation(() => {
                throw new Error('JWT signing failed');
            });

            await login(mockReq as Request, mockRes as Response);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Internal server error',
                error: expect.any(Error)
            });
        });
    });

    describe('Environment Variables', () => {
        it('should use JWT_SECRET from environment', async () => {
            const originalJwtSecret = process.env.JWT_SECRET;
            process.env.JWT_SECRET = 'test-secret';

            const loginData = {
                email: 'test@example.com',
                password: 'password123'
            };
            mockReq.body = loginData;

            const mockUserData = {
                _id: 'userId123',
                name: 'Test User',
                email: loginData.email,
                password: 'hashedPassword'
            };

            mockUser.findOne = jest.fn().mockResolvedValue(mockUserData);
            mockBcrypt.compare = jest.fn().mockResolvedValue(true);
            mockJwt.sign = jest.fn().mockReturnValue('mockToken');

            await login(mockReq as Request, mockRes as Response);

            expect(mockJwt.sign).toHaveBeenCalledWith(
                { id: mockUserData._id, email: mockUserData.email },
                'test-secret',
                { expiresIn: '1d' }
            );

            // Restore original environment variable
            process.env.JWT_SECRET = originalJwtSecret;
        });
    });
});