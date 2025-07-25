import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';

// Apenas admins podem listar todos os usuários
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Usuário pode ver seu próprio perfil
export const getProfile = async (req: Request, res: Response) => {
    try {
        const user = await User.findById((req as any).user.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Atualizar dados do usuário autenticado
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
        }
        const user = await User.findByIdAndUpdate((req as any).user.id, updates, { new: true }).select('-password');
        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Deletar o próprio usuário
export const deleteProfile = async (req: Request, res: Response) => {
    try {
        const userDeleted = await User.findByIdAndDelete((req as any).user.id);
        if (!userDeleted) return res.status(404).json({ message: 'User not found' });
        return res.json({ message: 'User deleted' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};