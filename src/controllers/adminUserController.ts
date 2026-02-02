import { Request, Response, NextFunction } from "express";
import { adminUserService } from "../services/adminUserService";

export const adminUserController = {
    // GET /api/admin/users?search=xxx&page=1
    getUsers: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const search = (req.query.search as string) || '';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await adminUserService.getUsers(search, page, limit);

            res.status(200).json({
                success: true,
                data: result.users,
                pagination: {
                    page,
                    limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    },

    // GET /api/admin/users/:id
    getUserById: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = parseInt(req.params.id);
            const user = await adminUserService.getUserById(userId);
            
            res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            next(error);
        }
    },

    // PATCH /api/admin/users/:id/status -> แบน/ปลดแบน
    toggleStatus: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = parseInt(req.params.id);
            const { is_active } = req.body; // ส่งมา { "is_active": false } คือแบน

            // เช็คว่าส่ง boolean มาจริงไหม
            if (typeof is_active !== 'boolean') {
                 res.status(400).json({ message: "is_active must be a boolean" });
                 return;
            }

            const updatedUser = await adminUserService.toggleUserBan(userId, is_active);

            res.status(200).json({
                success: true,
                message: `User ${is_active ? 'activated' : 'banned'} successfully`,
                data: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }
};