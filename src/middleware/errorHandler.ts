import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// ต้องมี 4 params เสมอ Express ถึงจะรู้ว่าเป็น Error Middleware
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // ถ้าเป็น Error ที่เรารู้จัก (AppError)
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            data: err.data || null
        });
    }

    // ถ้าเป็น Error อื่นๆ (Bugs, Database พัง) -> โยน 500
    console.error("🔥 Unexpected Error:", err); // Log ให้ Dev เห็น
    return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error. Something went wrong!'
    });
};