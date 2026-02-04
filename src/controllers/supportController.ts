import { Request, Response, NextFunction } from "express";
import { supportService } from "../services/supportService";
import { CustomAdminJwtPayload } from "../type/jwtType";

export const supportController = {
    // User ส่งเรื่อง
    submitTicket: async (req: Request, res: Response, next: NextFunction) => {
        try {
            // สมมติว่ามี Middleware แกะ User ID มาใส่ใน req.user
            const userId = (req as any).user?.id;
            const { topic, message } = req.body;

            if (!userId) throw new Error("User not found");

            const result = await supportService.createTicket(userId, topic, message);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    // Admin ดูรายการ
    getAllTickets: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await supportService.getAllTickets();
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    // Admin กดจบงาน
    resolveTicket: async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            const { adminResponse } = req.body; // เผื่อ Admin พิมพ์ตอบกลับ
            // ดึงชื่อ Admin จาก Token 
            const adminName = (req.user as CustomAdminJwtPayload).username;
            const result = await supportService.resolveTicket(Number(id), adminResponse, adminName);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
};