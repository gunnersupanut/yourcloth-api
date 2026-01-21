import { NextFunction, Request, Response } from "express";
import { adminOrderService } from "../services/adminOrderService"

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