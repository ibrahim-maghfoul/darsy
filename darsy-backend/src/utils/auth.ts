import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (userId: string): string => {
    return jwt.sign({ userId }, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
    });
};

export const generateRefreshToken = (userId: string): string => {
    return jwt.sign({ userId }, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
};

export const verifyAccessToken = (token: string): { userId: string } => {
    return jwt.verify(token, config.jwt.secret) as { userId: string };
};

export const verifyRefreshToken = (token: string): { userId: string } => {
    return jwt.verify(token, config.jwt.refreshSecret) as { userId: string };
};
