import { JwtPayload } from 'jsonwebtoken';

// ประกาศ type ให้ Request
declare global {
    namespace Express {
        export interface Request {
            // ประกาศ Requset ใหม่
            // จะมีช่อง user โผล่มาและไส้ในมันจะเป็นแบบนี้นะ
            user?: string | JwtPayload | { id: number }; // <-- ยัด Type ที่จะแปะเข้าไป
        }
    }
}

// Export {} เพื่อบอก TS ว่าไฟล์นี้คือ "Module"... ไม่งั้น 'declare global' จะไม่ทำงาน
export { };