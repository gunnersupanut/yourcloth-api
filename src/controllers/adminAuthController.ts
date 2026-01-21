import { AdminLoginReqBody, AdminRegisterReqBody } from "../type/adminTypes";
import { NextFunction, Request, Response } from 'express';
import { AppError } from "../utils/AppError";
import { adminService } from "../services/adminService";

export const adminRegisterController = async (
    req: Request<unknown, unknown, AdminRegisterReqBody>,
    res: Response,
    next: NextFunction) => {
    const { username, password, adminName } = req.body
    if (!username || !password || !adminName) {
        throw new AppError("Username, Adminname And Password are required", 400)
    }
    try {
        await adminService.register(username, password, adminName)
        res.status(201).json({
            message: 'Register admin Complete.',
        });
    } catch (error) {
        next(error);
    }
}
export const adminLoginController = async (
    req: Request<unknown, unknown, AdminLoginReqBody>,
    res: Response,
    next: NextFunction) => {
    const { username, password } = req.body
    if (!username || !password) {
        throw new AppError("Username And Password are required", 400)
    }
    try {
        const result = await adminService.login(username, password)
        res.status(200).json({
            message: 'Admin Login Complete.',
            token: result.token,
            admin: {                 
                id: result.id,
                name: result.name,
                role: 'ADMIN'
            }
        });
    } catch (error) {
        next(error);
    }
}