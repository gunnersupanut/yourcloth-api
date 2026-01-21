import { JwtPayload } from 'jsonwebtoken';

// สร้าง Type ของ Payload 
export interface CustomJwtPayload extends JwtPayload {
    id: number;
    username: string;
}
export interface CustomAdminJwtPayload extends JwtPayload {
    admin: {
        id: number;
        name: string;
        role: string;
    }
}