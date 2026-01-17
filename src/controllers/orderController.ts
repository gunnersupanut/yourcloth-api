import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { CreateOrderPayload } from '../type/orderTypes';
import { CustomJwtPayload } from '../type/jwtType';
import { AppError } from '../utils/AppError';

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
        res.status(500).json({ message: "Internal Server Error" });
    }
};
export const createOrderController = async (
    req: Request<unknown, unknown, CreateOrderPayload>,
    res: Response
) => {
    try {
        const userId = (req.user as CustomJwtPayload).id;
        const { addressId, items } = req.body;

        // Validation 
        if (!addressId || !items || items.length === 0) {
            throw new AppError("Address and items are required.", 400);
        }

        // เรียก Service
        const result = await orderService.createOrder(userId, { addressId, items });

        res.status(201).json({
            message: "Order created successfully!",
            data: result
        });

    } catch (error: any) {
        console.error("Create Order Error:", error);

        // เช็คด้วย instanceof
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({
                message: error.message,
                data: error.data
            });
        }

        // error อื่นๆ ที่เราไม่รู้จัก 
        res.status(500).json({ message: "Internal Server Error" });
    }
};
