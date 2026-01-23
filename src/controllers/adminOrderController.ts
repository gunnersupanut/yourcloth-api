import { NextFunction, Request, Response } from "express";
import { adminOrderService } from "../services/adminOrderService"
import { AppError } from "../utils/AppError";
import { CustomAdminJwtPayload } from "../type/jwtType";

export const getInspectingOrdersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await adminOrderService.getInspectingOrders();
        res.status(200).json({
            message: "Get inspecting order Complete.",
            data: result
        })
    } catch (error) {
        next(error);
    }
}
export const approvePaymentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // รับ Order ID จาก Params (เช่น /orders/:orderId/approve)
        const { orderId } = req.params;
        // เช็คว่าส่งมาจริงไหม 
        if (!orderId) {
            throw new AppError("Order ID is required", 400);
        }
        // ดึงชื่อ Admin จาก Token 
        const adminName = (req.user as CustomAdminJwtPayload).username;

        // เรียก Service
        await adminOrderService.moveOrderToPacking(Number(orderId), adminName);
        res.status(200).json({
            message: "Payment approved successfully. Order moved to PACKING status.",
            actionBy: adminName,
            orderId: orderId
        });

    } catch (error) {
        next(error);
    }
};
export const rejectPaymentController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        // ดึงชื่อ Admin จาก Token 
        const adminName = (req.user as CustomAdminJwtPayload).username;

        // validation ข้อมูล
        if (!orderId) throw new AppError("Order ID is required", 400);
        if (!reason) throw new AppError("Rejection reason is required", 400);

        // เรียก Service 
        await adminOrderService.rejectPaymentToPending(Number(orderId), adminName, reason);

        res.status(200).json({
            message: "Payment rejected. Order moved back to PENDING.",
            actionBy: adminName,
            reason: reason,
            orderId: orderId
        });

    } catch (error) {
        next(error);
    }
};