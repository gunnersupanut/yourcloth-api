import { NextFunction, Request, Response } from "express";
import { adminOrderService } from "../services/adminOrderService"
import { AppError } from "../utils/AppError";
import { CustomAdminJwtPayload } from "../type/jwtType";
export const getAdminOrdersController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // รับ Query Params จาก URL (เช่น ?page=1&status=PENDING)
        // ส่งไปให้ Service จัดการต่อ
        const result = await adminOrderService.getAdminOrders(req.query);

        res.status(200).json({
            success: true,
            message: "Fetch admin orders successfully",
            data: result
        });

    } catch (error) {
        next(error); // ส่ง Error ไปให้ Middleware จัดการ
    }
};
export const getAdminOrderDetailController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // เช็คก่อนว่าเป็นเลขไหม กันคนมั่วใส่ text มา
        if (!id || isNaN(Number(id))) {
            throw new AppError("Invalid Order ID", 400);
        }
        // เรียก Service 
        const order = await adminOrderService.getOrderDetails(Number(id));

        res.status(200).json({
            success: true,
            data: order
        });

    } catch (error) {
        next(error); // ส่งต่อให้ Global Error Handler
    }
};
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
};
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
export const shippingOrderController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.params;
        const { shippingCarrier, parcelNumber } = req.body;
        // ดึงชื่อ Admin จาก Token 
        const adminName = (req.user as CustomAdminJwtPayload).username;
        // validation ข้อมูล
        if (!orderId) throw new AppError("Order ID is required", 400);
        if (!shippingCarrier || !parcelNumber) throw new AppError("Rejection shipping carrier and parcel number is required", 400);
        const shippingDetail = {
            shippingCarrier, parcelNumber,
        }
        // เรียก Service 
        await adminOrderService.moveOrderToShipping(Number(orderId), adminName, shippingDetail);
        res.status(200).json({
            message: "Order is shipping. Order moved to SHIPPING.",
            actionBy: adminName,
            shippingCarrier: shippingCarrier,
            parcelNumber: parcelNumber,
            orderId: orderId
        });
    } catch (error) {
        next(error);
    }
};
export const adminConfirmReceivedController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const adminName = (req.user as CustomAdminJwtPayload).username;
        const orderId = Number(req.params.orderId);
        // Validation 
        if (isNaN(orderId)) {
            throw new AppError("Invalid Order ID", 400);
        }
        // เรียก Service
        await adminOrderService.moveToComplete(orderId, adminName);
        res.status(200).json({
            message: "Confirm recived successfully."
        });
    } catch (error) {
        next(error);
    }
};
export const adminCancelOrderController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { id } = req.params; // รับ Order ID จาก URL
        const { reason } = req.body; // รับเหตุผลจาก Modal

        // เช็คความถูกต้องของข้อมูล
        if (!id || isNaN(Number(id))) {
            throw new AppError("Invalid Order ID", 400);
        }
        if (!reason || !reason.trim()) {
            throw new AppError("Cancellation reason is required!", 400);
        }

        // ดึงชื่อ Admin จาก Token (Middleware แปะไว้ให้ใน req.user)
        const adminName = (req.user as CustomAdminJwtPayload).username;

        // เรียก Service
        const result = await adminOrderService.cancelOrderByAdmin(
            Number(id),
            adminName,
            reason
        );

        res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {
        next(error);
    }
};

