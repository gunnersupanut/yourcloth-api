import { JwtPayload } from 'jsonwebtoken';

// สร้าง Type ของ Payload 
export interface CustomJwtPayload extends JwtPayload {
    id: number;
}