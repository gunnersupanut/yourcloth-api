import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CustomJwtPayload } from '../type/jwtType';
const jwtSecret: string = process.env.JWT_SECRET as string


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // อ่าน Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Access token required or invalid format' });
        }
        // แยก Token
        const token = authHeader.split(' ')[1]; // ดึง token จาก headers

        // Verify
        const decodedToken = jwt.verify(token, jwtSecret) as CustomJwtPayload;
        // แปะว่า user ไหน
        req.user = decodedToken;
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}