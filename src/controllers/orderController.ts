import { NextFunction, Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { CancelPayload, CreateOrderPayload, MoveToInspectingPayload } from '../type/orderTypes';
import { CustomJwtPayload } from '../type/jwtType';
import { AppError } from '../utils/AppError';

export const getAllOrdersController = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;
        // เรียก Service 
        const orders = await orderService.getAllOrders(userId);

        // ส่งของ
        res.status(200).json({
            message: "Get all orders success",
            data: orders
        });

    } catch (error) {
        next(error);
    }
};
export const getOrderByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // รับ id จาก URL (/api/orders/:id)

        const order = await orderService.getOrderDetails(Number(id));

        res.status(200).json({
            message: "Order details fetched successfully",
            data: order
        });

    } catch (error: any) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const createOrderController = async (
    req: Request<unknown, unknown, CreateOrderPayload>,
    res: Response
) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;
        const userName = (req.user as CustomJwtPayload).username;
        const { addressId, items, paymentMethod, shippingMethod, shippingCost, cartItemIds } = req.body;

        // Validation 
        if (!addressId || !items || items.length === 0 || !paymentMethod || !shippingMethod || !shippingCost) {
            throw new AppError("Missing required fields: Address, Items, Payment, or Shipping.", 400);
        }

        // เรียก Service
        const result = await orderService.createOrder(userId, userName, { addressId, items, paymentMethod, shippingMethod, shippingCost, cartItemIds });

        res.status(201).json({
            message: "Order created successfully!",
            data: result
        });

    } catch (error: any) {
        // เช็คด้วย instanceof
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                message: error.message,
                data: error.data
            });
        }

        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const moveOrderToInspectingController = async (
    req: Request<{ orderId: string }, unknown, MoveToInspectingPayload>,
    res: Response
) => {
    try {
        const userName = (req.user as CustomJwtPayload).username;
        const orderId = Number(req.params.orderId);
        const { imageObj } = req.body;

        // Validation 
        if (isNaN(orderId)) {
            throw new AppError("Invalid Order ID", 400);
        }
        if (!imageObj) {
            throw new AppError("Invalid data don't have slip image.", 400);
        }

        // เรียก Service
        await orderService.moveToInspecting(orderId, userName, imageObj);
        console.log(`[PAYMENT] User: ${userName} uploaded slip for Order ID: ${orderId}`);
        res.status(200).json({
            message: "Move order to inspecting successfully!",
        });

    } catch (error: any) {
        // เช็คด้วย instanceof
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                message: error.message,
                data: error.data
            });
        }

        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const confirmReceived = async (
    req: Request<{ orderId: string }, unknown, MoveToInspectingPayload>,
    res: Response,
    next: NextFunction
) => {
    try {
        const userName = (req.user as CustomJwtPayload).username;
        const orderId = Number(req.params.orderId);
        // Validation 
        if (isNaN(orderId)) {
            throw new AppError("Invalid Order ID", 400);
        }
        // เรียก Service
        await orderService.moveToComplete(orderId, userName);
        res.status(200).json({
            message: "Confirm recived successfully."
        });
    } catch (error) {
        next(error);
    }
};
export const cancelOrderController = async (
    req: Request<{ orderId: string }, unknown, CancelPayload>,
    res: Response,
    next:NextFunction
) => {
    try {
        //  แกะ User (ใครเป็นคนยกเลิก)
        const userName = (req.user as CustomJwtPayload).username;
        const orderId = Number(req.params.orderId);
        const { problemDescription, attachments } = req.body;

        // Validation 
        if (isNaN(orderId)) {
            throw new AppError("Invalid Order ID", 400);
        }
        if (!problemDescription || !problemDescription.trim()) {
            throw new AppError("Problem description is required.", 400);
        }

        // เรียก Service 
        await orderService.moveToCancel(orderId, userName, problemDescription, attachments || []);

        // ตอบกลับ
        res.status(200).json({
            message: "Order cancelled successfully.",
        });

    } catch (error) {
        next(error);
    }
};