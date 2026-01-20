import { NextFunction, Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { CreateOrderPayload } from '../type/orderTypes';
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
        const { addressId, items, paymentMethod, shippingMethod, shippingCost, cartItemIds } = req.body;

        // Validation 
        if (!addressId || !items || items.length === 0 || !paymentMethod || !shippingMethod || !shippingCost) {
            throw new AppError("Missing required fields: Address, Items, Payment, or Shipping.", 400);
        }

        // เรียก Service
        const result = await orderService.createOrder(userId, { addressId, items, paymentMethod, shippingMethod, shippingCost, cartItemIds });

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
