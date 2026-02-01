import { NextFunction, Request, Response } from "express";
import pool from "../config/db";
import { CustomJwtPayload } from "../type/jwtType";
import { userService } from "../services/userService";


export const getMyProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;

        const getmyProfileSql = `
        SELECT username, name, surname, email, tel, birthday, gender
        FROM users
        WHERE id = $1
        `;
        const result = await pool.query(getmyProfileSql, [userId])
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: "Get My  Profile Complete.", result: result.rows[0] })
    } catch (error) {
        if (error instanceof Error) {
            console.error('[Get My Profile Error]:', error.message);
        } else {
            console.error('[Get My Profile Error]: Unknown error', error);
        }
        res.status(500).json({ error: `Get My Profile Fail` });
    }
}
export const userController = {
    // GET /api/users/profile
    getMyProfile: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // แกะ ID จาก Token (Middleware ต้องยัด user มาให้)
            const userId = (req.user as CustomJwtPayload).id;

            const user = await userService.getProfile(userId);

            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // PUT /api/users/profile
    updateMyProfile: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req.user as CustomJwtPayload).id;
            const body = req.body; 

            const updatedUser = await userService.updateProfile(userId, body);

            res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }
};